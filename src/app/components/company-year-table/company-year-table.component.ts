import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

interface CompanyYearData {
  company: string;
  yearTotals: Map<number, number>;
  total: number;
}

interface YearColumn {
  year: number;
  total: number;
}

@Component({
  selector: 'app-company-year-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-year-table.component.html',
  styleUrl: './company-year-table.component.scss'
})
export class CompanyYearTableComponent implements OnInit {
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
  totalBrutoColumn: string = 'TOTAL BRUTO';
  availableColumns: string[] = [];
  
  // Dados da tabela
  tableData: CompanyYearData[] = [];
  years: number[] = [];
  yearColumns: YearColumn[] = [];
  
  // Filtro de empresas (checkboxes)
  allCompanies: string[] = [];
  selectedCompanies: Set<string> = new Set();
  selectAll: boolean = false;
  
  // Mensagem de erro
  showNoDataMessage: boolean = false;
  
  // Total geral
  grandTotal: number = 0;

  constructor(
    private firestoreService: FirestoreService
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
    this.setDefaultDates();
  }

  /**
   * Define datas padrão (último ano)
   */
  setDefaultDates(): void {
    const today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    
    // Formato mmm/aaaa
    this.startDate = this.formatToMonthYear(lastYear);
    this.endDate = this.formatToMonthYear(today);
  }

  /**
   * Formata data para mm/aaaa
   */
  formatToMonthYear(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${month}/${date.getFullYear()}`;
  }

  /**
   * Converte string mm/aaaa para Date
   */
  parseMonthYear(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 2) return null;
    
    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);
    
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return null;
    
    return new Date(year, month - 1, 1);
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
        this.extractAllCompanies();
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
    for (const col of this.availableColumns) {
      const upperCol = col.toUpperCase();
      
      if (upperCol.includes('EMISSÃO') || upperCol.includes('EMISSAO')) {
        this.dateColumn = col;
      }
      if (upperCol.includes('NOME') && upperCol.includes('CLIFOR')) {
        this.companyColumn = col;
      }
      if (upperCol === 'TOTAL BRUTO') {
        this.totalBrutoColumn = col;
      }
    }
  }

  /**
   * Extrai todas as empresas dos documentos
   */
  extractAllCompanies(): void {
    const companiesSet = new Set<string>();
    
    this.documents.forEach(doc => {
      const company = String(doc[this.companyColumn] || 'Sem Nome').trim();
      companiesSet.add(company);
    });
    
    this.allCompanies = Array.from(companiesSet).sort();
    // Inicialmente nenhuma selecionada
    this.selectedCompanies = new Set();
  }

  /**
   * Alterna seleção de todas as empresas
   */
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedCompanies = new Set(this.allCompanies);
    } else {
      this.selectedCompanies.clear();
    }
  }

  /**
   * Atualiza estado do checkbox "Selecionar Todas"
   */
  updateSelectAll(): void {
    this.selectAll = this.selectedCompanies.size === this.allCompanies.length;
  }

  /**
   * Alterna seleção de uma empresa
   */
  toggleCompany(company: string): void {
    if (this.selectedCompanies.has(company)) {
      this.selectedCompanies.delete(company);
    } else {
      this.selectedCompanies.add(company);
    }
    this.updateSelectAll();
  }

  /**
   * Verifica se uma empresa está selecionada
   */
  isCompanySelected(company: string): boolean {
    return this.selectedCompanies.has(company);
  }

  /**
   * Gera tabela de análise
   */
  generateTable(): void {
    if (!this.startDate || !this.endDate) {
      alert('Selecione o período de análise');
      return;
    }

    if (this.selectedCompanies.size === 0) {
      alert('Selecione pelo menos uma empresa');
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

    // Filtra por empresas selecionadas
    const filteredByCompany = filteredDocs.filter(doc => {
      const company = String(doc[this.companyColumn] || 'Sem Nome').trim();
      return this.selectedCompanies.has(company);
    });

    if (filteredByCompany.length === 0) {
      this.showNoDataMessage = true;
      return;
    }

    // Agrupa por empresa e ano
    this.groupByCompanyAndYear(filteredByCompany);
    
    // Calcula total geral
    this.calculateGrandTotal();
    
    this.showResults = true;
  }

  /**
   * Filtra documentos por período
   */
  filterByDateRange(): any[] {
    // Converte mmm/aaaa para Date
    const startDate = this.parseMonthYear(this.startDate);
    const endDate = this.parseMonthYear(this.endDate);
    
    if (!startDate || !endDate) {
      alert('Formato de data inválido. Use mm/aaaa (ex: 11/2024)');
      return [];
    }
    
    // Define primeiro dia do mês inicial e último dia do mês final
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999);

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
   * Agrupa dados por empresa e ano
   */
  groupByCompanyAndYear(docs: any[]): void {
    const grouped = new Map<string, Map<number, number>>();
    const yearsSet = new Set<number>();
    
    docs.forEach(doc => {
      const company = String(doc[this.companyColumn] || 'Sem Nome').trim();
      const date = this.parseDate(doc[this.dateColumn]);
      
      if (date) {
        const year = date.getFullYear();
        const value = this.extractNumber(doc[this.totalBrutoColumn]);
        
        yearsSet.add(year);
        
        if (!grouped.has(company)) {
          grouped.set(company, new Map<number, number>());
        }
        
        const companyData = grouped.get(company)!;
        const currentValue = companyData.get(year) || 0;
        companyData.set(year, currentValue + value);
      }
    });

    // Ordena anos
    this.years = Array.from(yearsSet).sort();
    
    // Converte para array e calcula totais
    this.tableData = Array.from(grouped.entries()).map(([company, yearTotals]) => {
      const total = Array.from(yearTotals.values()).reduce((sum, val) => sum + val, 0);
      return {
        company,
        yearTotals,
        total
      };
    });

    // Ordena por total decrescente
    this.tableData.sort((a, b) => b.total - a.total);
    
    // Calcula totais por ano
    this.calculateYearTotals();
  }

  /**
   * Calcula totais por ano (colunas)
   */
  calculateYearTotals(): void {
    this.yearColumns = this.years.map(year => {
      const total = this.tableData.reduce((sum, row) => {
        return sum + (row.yearTotals.get(year) || 0);
      }, 0);
      return { year, total };
    });
  }

  /**
   * Calcula total geral
   */
  calculateGrandTotal(): void {
    this.grandTotal = this.tableData.reduce((sum, row) => sum + row.total, 0);
  }

  /**
   * Obtém valor para uma célula específica
   */
  getCellValue(company: CompanyYearData, year: number): number {
    return company.yearTotals.get(year) || 0;
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
   * Limpa filtros de período
   */
  clearPeriodFilter(): void {
    this.setDefaultDates();
  }

  /**
   * Limpa filtros de empresas (checkboxes)
   */
  clearCompanyFilter(): void {
    this.selectedCompanies = new Set();
    this.selectAll = false;
  }

  /**
   * Limpa todos os filtros
   */
  clearFilters(): void {
    this.clearPeriodFilter();
    this.clearCompanyFilter();
    this.showResults = false;
    this.tableData = [];
  }
}
