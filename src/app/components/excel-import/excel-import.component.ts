import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService, ExcelRow } from '../../services/excel-import.service';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-import.component.html',
  styleUrl: './excel-import.component.scss'
})
export class ExcelImportComponent {
  selectedFile: File | null = null;
  fileName: string = '';
  isLoading: boolean = false;
  importStatus: 'idle' | 'processing' | 'success' | 'error' = 'idle';
  statusMessage: string = '';
  previewData: ExcelRow[] = [];
  columnNames: string[] = [];
  totalRows: number = 0;
  
  // Progresso da importação
  importProgress: number = 0;
  importedCount: number = 0;
  totalToImport: number = 0;
  
  // Configuração das colunas - Define os tipos de dados para conversão
  collectionName: string = 'notas-levantamento';
  
  // Colunas a serem ignoradas (não serão importadas)
  ignoredColumns: string[] = [
    '__EMPTY',
    'DT.REF',
    'Hora',
    'Pergunta 01',
    'Pergunta 01 : Periodo',
    'Pergunta 02',
    'Pergunta 02 : Periodo Terceiros De',
    'Pergunta 03',
    'Pergunta 03 : Periodo Terceiros Até'
  ];
  
  // Colunas de data (serão convertidas para Timestamp do Firestore)
  dateColumns: string[] = [
    'EMISSÃO',
    'EMISSAO',
    'DATA DIGITACAO',
    'DATA DIGITAÇÃO'
  ];
  
  // Colunas de valores monetários (serão convertidas para number)
  currencyColumns: string[] = [
    'VALOR UNIT.',
    'VALOR UNITARIO',
    'VALOR UNITÁRIO',
    'TOTAL BRUTO',
    'TOTAL',
    'CUSTO',
    'ICMS',
    'CST',
    'DESCONTO',
    'ALIQ. CSLL TERCEIRO',
    'VALOR CSLL TERCEIRO',
    'ALIQ. PIS TERCEIRO',
    'VALOR PIS TERCEIRO',
    'ALIQ. COFINS TERCEIRO',
    'VALOR COFINS TERCEIRO',
    'VALOR',
    'ALIQ. INSS',
    'VALOR INSS',
    'ALIQ. IRRF',
    'VALOR IRRF'
  ];
  
  // Colunas numéricas (serão convertidas para number)
  numberColumns: string[] = [
    'QTD',
    'QUANTIDADE',
    'NF',
    'SERIE',
    'CLIFOR',
    'CNPJ',
    'NRCM',
    'TIPO PRODUTO'
  ];

  constructor(
    private excelImportService: ExcelImportService,
    private firestoreService: FirestoreService,
    public formatService: FormatService,
    private cdr: ChangeDetectorRef
  ) { }

  /**
   * Manipula a seleção de arquivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (!file) {
      this.resetFileSelection();
      return;
    }

    if (!this.excelImportService.isValidExcelFile(file)) {
      this.importStatus = 'error';
      this.statusMessage = 'Por favor, selecione um arquivo Excel válido (.xlsx, .xls ou .csv)';
      this.resetFileSelection();
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.importStatus = 'idle';
    this.statusMessage = '';
    this.loadPreview();
  }

  /**
   * Carrega uma prévia dos dados do Excel
   */
  async loadPreview(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      this.isLoading = true;
      const data = await this.excelImportService.readExcelFile(this.selectedFile);
      
      // Obtém todas as colunas
      const allColumns = this.excelImportService.getColumnNames(data);
      
      // Filtra colunas ignoradas (case-insensitive)
      this.columnNames = allColumns.filter(col => {
        const colUpper = col.toUpperCase();
        return !this.ignoredColumns.some(ic => ic.toUpperCase() === colUpper);
      });
      
      this.totalRows = data.length;
      this.previewData = data.slice(0, 5); // Mostra apenas as primeiras 5 linhas
      
      this.statusMessage = `Arquivo carregado: ${this.totalRows} linha(s) encontrada(s)`;
    } catch (error) {
      console.error('Erro ao carregar prévia:', error);
      this.importStatus = 'error';
      this.statusMessage = 'Erro ao ler o arquivo Excel';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Importa os dados do Excel para o Firestore
   */
  async importToFirestore(): Promise<void> {
    if (!this.selectedFile) {
      this.importStatus = 'error';
      this.statusMessage = 'Nenhum arquivo selecionado';
      return;
    }

    try {
      this.isLoading = true;
      this.importStatus = 'processing';
      this.statusMessage = 'Processando arquivo...';

      // Lê o arquivo Excel
      const data = await this.excelImportService.readExcelFile(this.selectedFile);

      if (data.length === 0) {
        this.importStatus = 'error';
        this.statusMessage = 'O arquivo não contém dados';
        return;
      }

      this.statusMessage = `Processando ${data.length} linha(s)...`;

      // Processa os dados aplicando formatações e removendo colunas ignoradas
      const processedData = this.excelImportService.processExcelData(
        data,
        this.dateColumns,
        this.currencyColumns,
        this.numberColumns,
        this.ignoredColumns
      );

      // Verifica duplicados antes de importar
      this.statusMessage = 'Verificando registros duplicados...';
      this.cdr.detectChanges();
      
      const existingDocs = await this.firestoreService.getAllDocuments(this.collectionName);
      const existingKeys = new Set<string>();
      
      existingDocs.forEach(doc => {
        const clifor = String(doc['NOME CLIFOR'] || '').trim().toUpperCase();
        const nf = String(doc['NF'] || '').trim().toUpperCase();
        const emissao = this.formatDateKey(doc['EMISSÃO'] || doc['EMISSAO']);
        const valor = this.extractNumber(doc['VALOR'] || doc['TOTAL'] || doc['TOTAL BRUTO']);
        const key = `${clifor}-${nf}-${emissao}-${valor}`;
        existingKeys.add(key);
      });

      // Verifica quais registros do arquivo já existem
      const duplicados: string[] = [];
      processedData.forEach(row => {
        const clifor = String(row['NOME CLIFOR'] || '').trim().toUpperCase();
        const nf = String(row['NF'] || '').trim().toUpperCase();
        const emissao = this.formatDateKey(row['EMISSÃO'] || row['EMISSAO']);
        const valor = this.extractNumber(row['VALOR'] || row['TOTAL'] || row['TOTAL BRUTO']);
        const key = `${clifor}-${nf}-${emissao}-${valor}`;
        
        if (existingKeys.has(key)) {
          duplicados.push(`${row['NOME CLIFOR']} - NF ${row['NF']}`);
        }
      });

      if (duplicados.length > 0) {
        this.importStatus = 'error';
        const maxShow = 10;
        const duplicadosMsg = duplicados.slice(0, maxShow).join(', ');
        const moreMsg = duplicados.length > maxShow ? ` e mais ${duplicados.length - maxShow} registro(s)` : '';
        this.statusMessage = `Importação bloqueada! ${duplicados.length} registro(s) já existe(m) no banco de dados: ${duplicadosMsg}${moreMsg}`;
        this.isLoading = false;
        return;
      }

      // Adiciona timestamp de importação
      const dataWithTimestamp = processedData.map(row => ({
        ...row,
        importadoEm: new Date(),
        arquivoOrigem: this.fileName
      }));

      // Inicializa progresso ANTES de começar
      this.totalToImport = dataWithTimestamp.length;
      this.importedCount = 0;
      this.importProgress = 0;
      this.statusMessage = `Importando... 0 de ${this.totalToImport} registros (0%)`;
      this.cdr.detectChanges(); // Força atualização inicial da UI

      // Calcula batch size para atualizar de 1 em 1% (mínimo 1, máximo 500)
      const batchSize = Math.max(1, Math.min(500, Math.floor(this.totalToImport / 100)));

      // Salva no Firestore com callback de progresso
      const totalAdded = await this.firestoreService.addDocumentsInBatch(
        this.collectionName,
        dataWithTimestamp,
        batchSize,
        (current, total) => {
          this.importedCount = current;
          this.importProgress = Math.round((current / total) * 100);
          this.statusMessage = `Importando... ${current} de ${total} registros (${this.importProgress}%)`;
          this.cdr.detectChanges(); // Força atualização da UI
        }
      );

      this.importStatus = 'success';
      this.statusMessage = `Sucesso! ${totalAdded} linha(s) importada(s) para o Firestore`;
      
      // Limpa após 3 segundos
      setTimeout(() => {
        this.resetImport();
      }, 3000);

    } catch (error) {
      console.error('Erro ao importar:', error);
      this.importStatus = 'error';
      this.statusMessage = 'Erro ao importar dados para o Firestore';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Reseta a seleção de arquivo
   */
  resetFileSelection(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.previewData = [];
    this.columnNames = [];
    this.totalRows = 0;
  }

  /**
   * Reseta todo o estado da importação
   */
  resetImport(): void {
    this.resetFileSelection();
    this.importStatus = 'idle';
    this.statusMessage = '';
    this.importProgress = 0;
    this.importedCount = 0;
    this.totalToImport = 0;
  }

  /**
   * Obtém a classe CSS baseada no status
   */
  getStatusClass(): string {
    switch (this.importStatus) {
      case 'processing':
        return 'status-processing';
      case 'success':
        return 'status-success';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  }

  /**
   * Formata valor para exibição na prévia
   */
  formatPreviewValue(value: any, columnName: string): string {
    if (value === null || value === undefined) return '-';
    
    const colUpper = columnName.toUpperCase();
    
    // Verifica se é coluna de data
    const isDateColumn = colUpper.includes('EMISSÃO') || 
                        colUpper.includes('EMISSAO') || 
                        colUpper.includes('DATA');
    
    if (isDateColumn) {
      // Se for número serial do Excel (datas são números entre 1 e 50000+)
      if (typeof value === 'number' && value > 1 && value < 100000) {
        // Converte serial do Excel para data
        const excelEpoch = new Date(1899, 11, 30);
        const days = value >= 60 ? value - 1 : value;
        const milliseconds = days * 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + milliseconds);
        return this.formatService.formatDate(date);
      }
      
      // Se for string de data, tenta formatar
      if (typeof value === 'string' && value.includes('/')) {
        return value; // Já está formatado
      }
      
      // Tenta converter para data
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return this.formatService.formatDate(date);
      }
    }
    
    // Verifica se é CNPJ, CLIFOR ou outros IDs (sem decimais)
    if (typeof value === 'number' && (colUpper.includes('CNPJ') || colUpper.includes('CLIFOR') || colUpper.includes('NF') || colUpper.includes('SERIE'))) {
      return Math.floor(value).toString();
    }
    
    // Verifica se é número que parece ser moeda
    if (typeof value === 'number' && (colUpper.includes('VALOR') || colUpper.includes('TOTAL') || colUpper.includes('CUSTO'))) {
      return this.formatService.formatCurrency(value);
    }
    
    // Verifica se é número
    if (typeof value === 'number') {
      return this.formatService.formatNumber(value, 0);
    }
    
    return String(value);
  }

  private extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  private formatDateKey(value: any): string {
    if (!value) return '';
    
    // Se for Timestamp do Firestore
    if (value && typeof value.toDate === 'function') {
      const date = value.toDate();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // Se for Date
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    
    // Se for número serial do Excel
    if (typeof value === 'number' && value > 1 && value < 100000) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = value >= 60 ? value - 1 : value;
      const milliseconds = days * 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + milliseconds);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // Se for string
    if (typeof value === 'string') {
      // Tenta parsear como data
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      return value;
    }
    
    return String(value);
  }
}
