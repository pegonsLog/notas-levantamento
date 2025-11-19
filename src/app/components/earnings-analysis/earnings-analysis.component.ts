import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

interface CompanyData {
  name: string;
  totalValorUnitario: number;
  totalBruto: number;
  totalGeral: number;
  recordCount: number;
  records: any[];
  chartValorUnitario: EChartsOption;
  chartTotalBruto: EChartsOption;
  chartTotal: EChartsOption;
  isExpanded: boolean;
}

@Component({
  selector: 'app-earnings-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective],
  templateUrl: './earnings-analysis.component.html',
  styleUrl: './earnings-analysis.component.scss'
})
export class EarningsAnalysisComponent implements OnInit {
  collectionName: string = 'notas-levantamento';
  documents: any[] = [];
  isLoading: boolean = false;
  showResults: boolean = false;
  
  // Filtros de período
  startDate: string = '';
  endDate: string = '';
  
  // Colunas fixas
  dateColumn: string = 'EMISSÃO';
  companyColumn: string = 'NOME CLIFOR';
  valorUnitarioColumn: string = 'VALOR UNIT.';
  totalBrutoColumn: string = 'TOTAL BRUTO';
  totalColumn: string = 'TOTAL';
  availableColumns: string[] = [];
  
  // Dados por empresa
  companies: CompanyData[] = [];
  filteredCompanies: CompanyData[] = [];
  
  // Filtro de empresa
  selectedCompany: string = 'all';
  companyNames: string[] = [];
  
  // Mensagem de erro
  showNoDataMessage: boolean = false;
  
  // Totais gerais
  totalGeralValorUnitario: number = 0;
  totalGeralBruto: number = 0;
  totalGeralTotal: number = 0;
  companiesCount: number = 0;

  constructor(
    private firestoreService: FirestoreService,
    public formatService: FormatService
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
    this.setDefaultDates();
  }

  /**
   * Define datas padrão (último mês)
   */
  setDefaultDates(): void {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Formato yyyy-mm-dd para o input type="date"
    this.startDate = lastMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  /**
   * Converte data do formato yyyy-mm-dd para dd/mm/yyyy
   */
  formatDateToBR(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Converte data do formato dd/mm/yyyy para Date
   */
  parseBRDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Se já for formato yyyy-mm-dd
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    
    // Se for formato dd/mm/yyyy
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    
    return null;
  }

  /**
   * Carrega documentos do Firestore
   */
  async loadDocuments(): Promise<void> {
    try {
      this.isLoading = true;
      this.documents = await this.firestoreService.getAllDocuments(this.collectionName);
      
      if (this.documents.length > 0) {
        this.availableColumns = Object.keys(this.documents[0]).filter(key => key !== 'id');
        this.autoDetectColumns();
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      alert('Erro ao carregar dados. Verifique o console.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Detecta automaticamente colunas
   */
  autoDetectColumns(): void {
    // Procura pelas colunas específicas
    for (const col of this.availableColumns) {
      const upperCol = col.toUpperCase();
      
      if (upperCol.includes('EMISSÃO') || upperCol.includes('EMISSAO')) {
        this.dateColumn = col;
      }
      if (upperCol.includes('NOME') && upperCol.includes('CLIFOR')) {
        this.companyColumn = col;
      }
      if (upperCol === 'VALOR UNIT.' || upperCol === 'VALOR UNITARIO' || upperCol === 'VALOR UNITÁRIO') {
        this.valorUnitarioColumn = col;
      }
      if (upperCol === 'TOTAL BRUTO') {
        this.totalBrutoColumn = col;
      }
      if (upperCol === 'TOTAL') {
        this.totalColumn = col;
      }
    }
  }

  /**
   * Gera análise de ganhos
   */
  generateAnalysis(): void {
    if (!this.startDate || !this.endDate) {
      alert('Selecione o período de análise');
      return;
    }

    // Reseta mensagem de erro
    this.showNoDataMessage = false;
    this.showResults = false;

    // Filtra por período
    const filteredDocs = this.filterByDateRange();
    
    if (filteredDocs.length === 0) {
      this.showNoDataMessage = true;
      return;
    }

    // Agrupa por empresa
    this.groupByCompany(filteredDocs);
    
    // Extrai nomes das empresas para o filtro
    this.companyNames = this.companies.map(c => c.name).sort();
    
    // Aplica filtro inicial (todas)
    this.applyCompanyFilter();
    
    // Calcula totais
    this.calculateTotals();
    
    this.showResults = true;
  }

  /**
   * Aplica filtro de empresa
   */
  applyCompanyFilter(): void {
    if (this.selectedCompany === 'all') {
      this.filteredCompanies = [...this.companies];
    } else {
      this.filteredCompanies = this.companies.filter(c => c.name === this.selectedCompany);
    }
    
    // Mantém ordenação por nome do cliente crescente
    this.filteredCompanies.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filtra documentos por período
   */
  filterByDateRange(): any[] {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    return this.documents.filter(doc => {
      const docDate = this.parseDate(doc[this.dateColumn]);
      return docDate && docDate >= start && docDate <= end;
    });
  }

  /**
   * Converte valor para data
   */
  parseDate(value: any): Date | null {
    if (!value) return null;
    
    if (value instanceof Date) return value;
    
    // Firestore Timestamp
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    // String de data
    if (typeof value === 'string') {
      // Tenta formato dd/mm/yyyy
      const parts = value.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      // Tenta ISO
      return new Date(value);
    }
    
    return null;
  }

  /**
   * Agrupa dados por empresa
   */
  groupByCompany(docs: any[]): void {
    const grouped = new Map<string, any[]>();
    
    docs.forEach(doc => {
      const company = String(doc[this.companyColumn] || 'Sem Nome').trim();
      
      if (!grouped.has(company)) {
        grouped.set(company, []);
      }
      grouped.get(company)!.push(doc);
    });

    this.companies = Array.from(grouped.entries()).map(([name, records]) => {
      // Calcula totais para cada campo
      const valoresUnitarios = records.map(r => this.extractNumber(r[this.valorUnitarioColumn]));
      const valoresBrutos = records.map(r => this.extractNumber(r[this.totalBrutoColumn]));
      const valoresTotais = records.map(r => this.extractNumber(r[this.totalColumn]));
      
      const totalValorUnitario = valoresUnitarios.reduce((sum, val) => sum + val, 0);
      const totalBruto = valoresBrutos.reduce((sum, val) => sum + val, 0);
      const totalGeral = valoresTotais.reduce((sum, val) => sum + val, 0);

      return {
        name,
        totalValorUnitario,
        totalBruto,
        totalGeral,
        recordCount: records.length,
        records,
        chartValorUnitario: this.createCompanyChart(name, records, this.valorUnitarioColumn, 'Valor Unitário'),
        chartTotalBruto: this.createCompanyChart(name, records, this.totalBrutoColumn, 'Total Bruto'),
        chartTotal: this.createCompanyChart(name, records, this.totalColumn, 'Total'),
        isExpanded: false
      };
    });

    // Ordena por nome do cliente crescente
    this.companies.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Cria gráfico de barras para uma empresa
   */
  createCompanyChart(companyName: string, records: any[], valueColumn: string, chartTitle: string): EChartsOption {
    // Agrupa por mês
    const monthlyData = new Map<string, number>();
    
    records.forEach(record => {
      const date = this.parseDate(record[this.dateColumn]);
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = this.extractNumber(record[valueColumn]);
        
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, monthlyData.get(monthKey)! + value);
        } else {
          monthlyData.set(monthKey, value);
        }
      }
    });

    // Ordena por mês
    const sorted = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const months = sorted.map(item => this.formatMonth(item[0]));
    const values = sorted.map(item => item[1]);

    return {
      title: {
        text: `${chartTitle} - ${companyName}`,
        left: 'center',
        textStyle: {
          fontFamily: 'Montserrat',
          fontSize: 16,
          fontWeight: 600,
          color: '#2d3748'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${chartTitle}: ${this.formatCurrency(data.value)}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          fontFamily: 'Montserrat',
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Montserrat',
          formatter: (value: number) => this.formatCurrency(value)
        }
      },
      series: [{
        name: chartTitle,
        type: 'bar',
        data: values,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: '#667eea'
            }, {
              offset: 1,
              color: '#764ba2'
            }]
          },
          borderRadius: [8, 8, 0, 0]
        },
        barMaxWidth: 60
      }]
    };
  }

  /**
   * Formata mês (YYYY-MM para Mês/Ano)
   */
  formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year}`;
  }

  /**
   * Calcula totais gerais
   */
  calculateTotals(): void {
    this.totalGeralValorUnitario = this.companies.reduce((sum, company) => sum + company.totalValorUnitario, 0);
    this.totalGeralBruto = this.companies.reduce((sum, company) => sum + company.totalBruto, 0);
    this.totalGeralTotal = this.companies.reduce((sum, company) => sum + company.totalGeral, 0);
    this.companiesCount = this.companies.length;
  }

  /**
   * Extrai número de um valor
   */
  extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  /**
   * Alterna expansão do acordeão
   */
  toggleAccordion(company: CompanyData): void {
    company.isExpanded = !company.isExpanded;
  }

  /**
   * Formata moeda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }

  /**
   * Limpa filtros
   */
  clearFilters(): void {
    this.setDefaultDates();
    this.showResults = false;
    this.companies = [];
  }
}
