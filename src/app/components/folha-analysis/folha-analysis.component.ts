import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

interface FuncionarioData {
  name: string;
  totalSalario: number;
  totalLiquido: number;
  totalDescontos: number;
  totalAdicionais: number;
  recordCount: number;
  records: any[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-folha-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsDirective],
  templateUrl: './folha-analysis.component.html',
  styleUrl: './folha-analysis.component.scss'
})
export class FolhaAnalysisComponent implements OnInit {
  collectionName: string = 'folha-pagamento';
  documents: any[] = [];
  isLoading: boolean = false;
  showResults: boolean = false;
  
  // Filtros
  selectedYear: number = new Date().getFullYear();
  selectedMonth: string = 'all';
  availableYears: number[] = [];
  
  // Dados por funcionário
  funcionarios: FuncionarioData[] = [];
  filteredFuncionarios: FuncionarioData[] = [];
  
  // Filtro de funcionário
  selectedFuncionario: string = 'all';
  funcionarioNames: string[] = [];
  
  showNoDataMessage: boolean = false;
  
  // Totais gerais
  totalGeralSalario: number = 0;
  totalGeralLiquido: number = 0;
  totalGeralDescontos: number = 0;
  totalGeralAdicionais: number = 0;
  funcionariosCount: number = 0;
  
  // Gráficos gerais
  chartCustoMensal: EChartsOption = {};
  chartDistribuicao: EChartsOption = {};
  chartSalarioFuncionario: EChartsOption = {};

  // Colunas de descontos
  descontoColumns = ['INSS', 'INSS13º', 'INSS FERIAS', 'SISTEMA S', 'RAT', 'FGTS', 'IRRF', 'IRRF FERIAS', 'ODONTO', 'VALE CULTURA', 'FARMACIA'];
  
  // Colunas de adicionais
  adicionalColumns = ['COMISSAO+DSR', 'HORAS EXTRAS', 'BONUS', 'INSALUBRIDADE', 'FERIAS', 'ADIANTAMENTO'];

  constructor(
    private firestoreService: FirestoreService,
    public formatService: FormatService
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    try {
      this.isLoading = true;
      this.documents = await this.firestoreService.getAllDocuments(this.collectionName);
      
      // Extrai anos disponíveis
      const years = new Set<number>();
      this.documents.forEach(doc => {
        const ano = this.extractNumber(doc['ANO']);
        if (ano > 2000 && ano < 2100) years.add(ano);
      });
      this.availableYears = Array.from(years).sort((a, b) => b - a);
      
      if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
        this.selectedYear = this.availableYears[0];
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      alert('Erro ao carregar dados.');
    } finally {
      this.isLoading = false;
    }
  }

  generateAnalysis(): void {
    this.showNoDataMessage = false;
    this.showResults = false;

    const filteredDocs = this.filterDocuments();
    
    if (filteredDocs.length === 0) {
      this.showNoDataMessage = true;
      return;
    }

    this.groupByFuncionario(filteredDocs);
    this.funcionarioNames = this.funcionarios.map(f => f.name).sort();
    this.applyFuncionarioFilter();
    this.calculateTotals();
    this.createGeneralCharts(filteredDocs);
    this.createSalarioFuncionarioChart();
    
    this.showResults = true;
  }

  filterDocuments(): any[] {
    return this.documents.filter(doc => {
      const ano = this.extractNumber(doc['ANO']);
      if (ano !== this.selectedYear) return false;
      
      if (this.selectedMonth !== 'all') {
        const mes = this.extractNumber(doc['MES']);
        if (mes !== parseInt(this.selectedMonth)) return false;
      }
      
      return true;
    });
  }

  groupByFuncionario(docs: any[]): void {
    const grouped = new Map<string, any[]>();
    
    docs.forEach(doc => {
      const funcionario = String(doc['FUNCIONARIO'] || 'Sem Nome').trim();
      if (!grouped.has(funcionario)) {
        grouped.set(funcionario, []);
      }
      grouped.get(funcionario)!.push(doc);
    });

    this.funcionarios = Array.from(grouped.entries()).map(([name, records]) => {
      const totalSalario = records.reduce((sum, r) => sum + this.extractNumber(r['SALARIO MES'] || r['SALARIO']), 0);
      const totalLiquido = records.reduce((sum, r) => sum + this.extractNumber(r['SALARIO LIQUIDO']), 0);
      
      let totalDescontos = 0;
      this.descontoColumns.forEach(col => {
        totalDescontos += records.reduce((sum, r) => sum + this.extractNumber(r[col]), 0);
      });
      
      let totalAdicionais = 0;
      this.adicionalColumns.forEach(col => {
        totalAdicionais += records.reduce((sum, r) => sum + this.extractNumber(r[col]), 0);
      });

      return {
        name,
        totalSalario,
        totalLiquido,
        totalDescontos,
        totalAdicionais,
        recordCount: records.length,
        records,
        isExpanded: false
      };
    });

    this.funcionarios.sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFuncionarioFilter(): void {
    if (this.selectedFuncionario === 'all') {
      this.filteredFuncionarios = [...this.funcionarios];
    } else {
      this.filteredFuncionarios = this.funcionarios.filter(f => f.name === this.selectedFuncionario);
    }
  }

  calculateTotals(): void {
    this.totalGeralSalario = this.funcionarios.reduce((sum, f) => sum + f.totalSalario, 0);
    this.totalGeralLiquido = this.funcionarios.reduce((sum, f) => sum + f.totalLiquido, 0);
    this.totalGeralDescontos = this.funcionarios.reduce((sum, f) => sum + f.totalDescontos, 0);
    this.totalGeralAdicionais = this.funcionarios.reduce((sum, f) => sum + f.totalAdicionais, 0);
    this.funcionariosCount = this.funcionarios.length;
  }

  createGeneralCharts(docs: any[]): void {
    // Gráfico de custo mensal
    const monthlyData = new Map<number, number>();
    docs.forEach(doc => {
      const mes = this.extractNumber(doc['MES']);
      const valor = this.extractNumber(doc['SALARIO MES'] || doc['SALARIO']);
      monthlyData.set(mes, (monthlyData.get(mes) || 0) + valor);
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthValues = Array.from({ length: 12 }, (_, i) => monthlyData.get(i + 1) || 0);

    this.chartCustoMensal = {
      title: {
        text: `Custo Mensal com Folha - ${this.selectedYear}`,
        left: 'center',
        textStyle: { fontFamily: 'Montserrat', fontSize: 16, fontWeight: 600, color: '#2d3748' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>Total: ${this.formatCurrency(data.value)}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontFamily: 'Montserrat' }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Montserrat',
          formatter: (value: number) => this.formatCurrency(value)
        }
      },
      series: [{
        name: 'Custo',
        type: 'bar',
        data: monthValues,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#38a169' },
              { offset: 1, color: '#2f855a' }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        },
        barMaxWidth: 50
      }]
    };

    // Gráfico de distribuição por centro de custo
    const ccData = new Map<string, number>();
    docs.forEach(doc => {
      const cc = String(doc['DESCRICAO CC'] || doc['CENTRO CUSTO'] || 'Outros').trim();
      const valor = this.extractNumber(doc['SALARIO MES'] || doc['SALARIO']);
      ccData.set(cc, (ccData.get(cc) || 0) + valor);
    });

    const pieData = Array.from(ccData.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    this.chartDistribuicao = {
      title: {
        text: 'Distribuição por Centro de Custo',
        left: 'center',
        textStyle: { fontFamily: 'Montserrat', fontSize: 16, fontWeight: 600, color: '#2d3748' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}<br/>${this.formatCurrency(params.value)} (${params.percent}%)`
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: { fontFamily: 'Montserrat' }
      },
      series: [{
        name: 'Centro de Custo',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: pieData
      }]
    };
  }

  createSalarioFuncionarioChart(): void {
    // Ordena por salário decrescente e pega os top 15
    const sortedFuncionarios = [...this.funcionarios]
      .sort((a, b) => b.totalSalario - a.totalSalario)
      .slice(0, 15);

    const names = sortedFuncionarios.map(f => f.name);
    const salarios = sortedFuncionarios.map(f => f.totalSalario);

    this.chartSalarioFuncionario = {
      title: {
        text: 'Salário por Funcionário (Top 15)',
        left: 'center',
        textStyle: { fontFamily: 'Montserrat', fontSize: 16, fontWeight: 600, color: '#2d3748' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>Salário: ${this.formatCurrency(data.value)}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          fontFamily: 'Montserrat',
          rotate: 45,
          interval: 0,
          fontSize: 10
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
        name: 'Salário',
        type: 'bar',
        data: salarios,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3182ce' },
              { offset: 1, color: '#2c5282' }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        },
        barMaxWidth: 40
      }]
    };
  }

  extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  toggleAccordion(funcionario: FuncionarioData): void {
    funcionario.isExpanded = !funcionario.isExpanded;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }

  getMonthName(mes: number): string {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[mes - 1] || '';
  }

  clearFilters(): void {
    this.selectedYear = this.availableYears[0] || new Date().getFullYear();
    this.selectedMonth = 'all';
    this.selectedFuncionario = 'all';
    this.showResults = false;
    this.funcionarios = [];
  }
}
