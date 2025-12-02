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
  selectedYearStart: number = new Date().getFullYear();
  selectedYearEnd: number = new Date().getFullYear();
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
  
  // Gráfico de gasto específico
  selectedGasto: string = '';
  chartGastoMensal: EChartsOption = {};
  showGastoChart: boolean = false;
  
  // Colunas de gastos disponíveis para o filtro (exceto vale cultura, abonos e farmácia)
  gastosColumns: { value: string, label: string }[] = [
    { value: 'SALARIO MES', label: 'Salário Mensal' },
    { value: 'SALARIO LIQUIDO', label: 'Salário Líquido' },
    { value: 'ADIANTAMENTO', label: 'Adiantamento' },
    { value: 'COMISSAO+DSR', label: 'Comissão + DSR' },
    { value: 'HORAS EXTRAS', label: 'Horas Extras' },
    { value: 'INSALUBRIDADE', label: 'Insalubridade' },
    { value: 'FERIAS', label: 'Férias' },
    { value: 'INSS', label: 'INSS' },
    { value: 'INSS13º', label: 'INSS 13º' },
    { value: 'INSS FERIAS', label: 'INSS Férias' },
    { value: 'SISTEMA S', label: 'Sistema S' },
    { value: 'RAT', label: 'RAT' },
    { value: 'FGTS', label: 'FGTS' },
    { value: 'IRRF', label: 'IRRF' },
    { value: 'IRRF FERIAS', label: 'IRRF Férias' },
    { value: 'ODONTO', label: 'Odonto' }
  ];

  // Colunas de descontos
  descontoColumns = ['INSS', 'INSS13º', 'INSS FERIAS', 'SISTEMA S', 'RAT', 'FGTS', 'IRRF', 'IRRF FERIAS', 'ODONTO', 'VALE CULTURA', 'FARMACIA'];
  
  // Colunas de adicionais
  adicionalColumns = ['COMISSAO+DSR', 'HORAS EXTRAS', 'INSALUBRIDADE', 'FERIAS', 'ADIANTAMENTO'];

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
      
      if (this.availableYears.length > 0) {
        if (!this.availableYears.includes(this.selectedYearStart)) {
          this.selectedYearStart = this.availableYears[this.availableYears.length - 1]; // Ano mais antigo
        }
        if (!this.availableYears.includes(this.selectedYearEnd)) {
          this.selectedYearEnd = this.availableYears[0]; // Ano mais recente
        }
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
    
    this.showResults = true;
  }

  filterDocuments(): any[] {
    const yearStart = Number(this.selectedYearStart);
    const yearEnd = Number(this.selectedYearEnd);
    
    return this.documents.filter(doc => {
      const ano = this.extractNumber(doc['ANO']);
      if (ano < yearStart || ano > yearEnd) return false;
      
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

      // Ordena registros por ano e mês decrescente
      const sortedRecords = records.sort((a, b) => {
        const anoA = this.extractNumber(a['ANO']);
        const anoB = this.extractNumber(b['ANO']);
        if (anoA !== anoB) return anoB - anoA;
        const mesA = this.extractNumber(a['MES']);
        const mesB = this.extractNumber(b['MES']);
        return mesB - mesA;
      });

      return {
        name,
        totalSalario,
        totalLiquido,
        totalDescontos,
        totalAdicionais,
        recordCount: sortedRecords.length,
        records: sortedRecords,
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
    // Gráfico de custo mensal - agrupa por ano e mês dinamicamente
    const yearStart = Number(this.selectedYearStart);
    const yearEnd = Number(this.selectedYearEnd);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Agrupa valores por ano-mês
    const monthlyData = new Map<string, number>();
    docs.forEach(doc => {
      const ano = this.extractNumber(doc['ANO']);
      const mes = this.extractNumber(doc['MES']);
      const valor = this.extractNumber(doc['SALARIO MES'] || doc['SALARIO']);
      const key = `${ano}-${String(mes).padStart(2, '0')}`; // Para ordenação correta
      monthlyData.set(key, (monthlyData.get(key) || 0) + valor);
    });

    // Ordena as chaves cronologicamente
    const sortedKeys = Array.from(monthlyData.keys()).sort();
    
    // Cria labels e valores
    const labels: string[] = [];
    const monthValues: number[] = [];
    
    sortedKeys.forEach(key => {
      const [year, month] = key.split('-');
      const monthIndex = parseInt(month) - 1;
      const label = yearStart === yearEnd 
        ? monthNames[monthIndex] 
        : `${monthNames[monthIndex]}/${year.slice(-2)}`;
      labels.push(label);
      monthValues.push(monthlyData.get(key) || 0);
    });

    this.chartCustoMensal = {
      title: {
        text: `Custo Mensal com Folha - ${this.selectedYearStart}${yearStart !== yearEnd ? ' a ' + this.selectedYearEnd : ''}`,
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
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { 
          fontFamily: 'Montserrat',
          rotate: yearStart !== yearEnd ? 45 : 0,
          fontSize: yearStart !== yearEnd ? 10 : 12
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

  getMonthShortName(mes: number): string {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[mes - 1] || '';
  }

  clearFilters(): void {
    this.selectedYearStart = this.availableYears[this.availableYears.length - 1] || new Date().getFullYear();
    this.selectedYearEnd = this.availableYears[0] || new Date().getFullYear();
    this.selectedFuncionario = 'all';
    this.selectedGasto = '';
    this.showResults = false;
    this.showGastoChart = false;
    this.funcionarios = [];
  }

  onGastoChange(): void {
    if (!this.selectedGasto) {
      this.showGastoChart = false;
      return;
    }
    this.createGastoMensalChart();
    this.showGastoChart = true;
  }

  createGastoMensalChart(): void {
    const filteredDocs = this.filterDocuments();
    const yearStart = Number(this.selectedYearStart);
    const yearEnd = Number(this.selectedYearEnd);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Agrupa valores por ano-mês dinamicamente
    const monthlyData = new Map<string, number>();
    filteredDocs.forEach(doc => {
      const ano = this.extractNumber(doc['ANO']);
      const mes = this.extractNumber(doc['MES']);
      const valor = this.extractNumber(doc[this.selectedGasto]);
      const key = `${ano}-${String(mes).padStart(2, '0')}`;
      monthlyData.set(key, (monthlyData.get(key) || 0) + valor);
    });

    // Ordena as chaves cronologicamente
    const sortedKeys = Array.from(monthlyData.keys()).sort();
    
    // Cria labels e valores
    const labels: string[] = [];
    const monthValues: number[] = [];
    
    sortedKeys.forEach(key => {
      const [year, month] = key.split('-');
      const monthIndex = parseInt(month) - 1;
      const label = yearStart === yearEnd 
        ? monthNames[monthIndex] 
        : `${monthNames[monthIndex]}/${year.slice(-2)}`;
      labels.push(label);
      monthValues.push(monthlyData.get(key) || 0);
    });
    
    // Encontra o label do gasto selecionado
    const gastoLabel = this.gastosColumns.find(g => g.value === this.selectedGasto)?.label || this.selectedGasto;

    this.chartGastoMensal = {
      title: {
        text: `${gastoLabel} por Mês - ${this.selectedYearStart}${yearStart !== yearEnd ? ' a ' + this.selectedYearEnd : ''}`,
        left: 'center',
        textStyle: { fontFamily: 'Montserrat', fontSize: 16, fontWeight: 600, color: '#2d3748' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${gastoLabel}: ${this.formatCurrency(data.value)}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { 
          fontFamily: 'Montserrat',
          rotate: yearStart !== yearEnd ? 45 : 0,
          fontSize: yearStart !== yearEnd ? 10 : 12
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
        name: gastoLabel,
        type: 'bar',
        data: monthValues,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#805ad5' },
              { offset: 1, color: '#6b46c1' }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        },
        barMaxWidth: 50,
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value > 0 ? this.formatCurrency(params.value) : '',
          fontFamily: 'Montserrat',
          fontSize: 10,
          color: '#4a5568'
        }
      }]
    };
  }
}
