import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService, ExcelRow } from '../../services/excel-import.service';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-folha-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folha-import.component.html',
  styleUrl: './folha-import.component.scss'
})
export class FolhaImportComponent {
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
  collectionName: string = 'folha-pagamento';
  
  // Colunas a serem ignoradas (não serão importadas)
  ignoredColumns: string[] = [];
  
  // Colunas de data (serão convertidas para Timestamp do Firestore)
  dateColumns: string[] = [];
  
  // Colunas de valores monetários (serão convertidas para number)
  currencyColumns: string[] = [
    'SALARIO',
    'SALÁRIO',
    'SALARIO MES',
    'SALÁRIO MÊS',
    'ADIANTAMENTO',
    'SALARIO LIQUIDO',
    'SALÁRIO LÍQUIDO',
    'COMISSAO+DSR',
    'COMISSÃO+DSR',
    'HORAS EXTRAS',
    'BONUS',
    'BÔNUS',
    'INSALUBRIDADE',
    'FERIAS',
    'FÉRIAS',
    'ODONTO',
    'VALE CULTURA',
    'FARMACIA',
    'FARMÁCIA',
    'INSS',
    'INSS13º',
    'INSS FERIAS',
    'INSS FÉRIAS',
    'SISTEMA S',
    'RAT',
    'FGTS',
    'IRRF',
    'IRRF FERIAS',
    'IRRF FÉRIAS'
  ];
  
  // Colunas numéricas (serão convertidas para number)
  numberColumns: string[] = [
    'MES',
    'MÊS',
    'ANO'
  ];

  constructor(
    private excelImportService: ExcelImportService,
    private firestoreService: FirestoreService,
    public formatService: FormatService,
    private cdr: ChangeDetectorRef
  ) { }

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

  async loadPreview(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      this.isLoading = true;
      const data = await this.excelImportService.readExcelFile(this.selectedFile);
      
      const allColumns = this.excelImportService.getColumnNames(data);
      
      this.columnNames = allColumns.filter(col => {
        const colUpper = col.toUpperCase();
        return !this.ignoredColumns.some(ic => ic.toUpperCase() === colUpper);
      });
      
      this.totalRows = data.length;
      this.previewData = data.slice(0, 5);
      
      this.statusMessage = `Arquivo carregado: ${this.totalRows} linha(s) encontrada(s)`;
    } catch (error) {
      console.error('Erro ao carregar prévia:', error);
      this.importStatus = 'error';
      this.statusMessage = 'Erro ao ler o arquivo Excel';
    } finally {
      this.isLoading = false;
    }
  }

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

      const data = await this.excelImportService.readExcelFile(this.selectedFile);

      if (data.length === 0) {
        this.importStatus = 'error';
        this.statusMessage = 'O arquivo não contém dados';
        return;
      }

      this.statusMessage = `Processando ${data.length} linha(s)...`;

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
        const funcionario = String(doc['FUNCIONARIO'] || '').trim().toUpperCase();
        const mes = this.extractNumber(doc['MES']);
        const ano = this.extractNumber(doc['ANO']);
        const key = `${funcionario}-${mes}-${ano}`;
        existingKeys.add(key);
      });

      // Verifica quais registros do arquivo já existem
      const duplicados: string[] = [];
      processedData.forEach(row => {
        const funcionario = String(row['FUNCIONARIO'] || '').trim().toUpperCase();
        const mes = this.extractNumber(row['MES']);
        const ano = this.extractNumber(row['ANO']);
        const key = `${funcionario}-${mes}-${ano}`;
        
        if (existingKeys.has(key)) {
          duplicados.push(`${row['FUNCIONARIO']} - ${mes}/${ano}`);
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

  resetFileSelection(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.previewData = [];
    this.columnNames = [];
    this.totalRows = 0;
  }

  resetImport(): void {
    this.resetFileSelection();
    this.importStatus = 'idle';
    this.statusMessage = '';
    this.importProgress = 0;
    this.importedCount = 0;
    this.totalToImport = 0;
  }

  getStatusClass(): string {
    switch (this.importStatus) {
      case 'processing': return 'status-processing';
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      default: return '';
    }
  }

  formatPreviewValue(value: any, columnName: string): string {
    if (value === null || value === undefined) return '-';
    
    const colUpper = columnName.toUpperCase();
    
    // Verifica se é coluna monetária
    const isCurrencyColumn = this.currencyColumns.some(cc => cc.toUpperCase() === colUpper);
    if (isCurrencyColumn && typeof value === 'number') {
      return this.formatService.formatCurrency(value);
    }
    
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
}
