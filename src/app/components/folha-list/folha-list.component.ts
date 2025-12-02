import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-folha-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folha-list.component.html',
  styleUrl: './folha-list.component.scss'
})
export class FolhaListComponent implements OnInit {
  collectionName: string = 'folha-pagamento';
  documents: any[] = [];
  filteredDocuments: any[] = [];
  isLoading: boolean = false;
  
  showModal: boolean = false;
  selectedDocument: any = null;
  
  searchTerm: string = '';
  filterColumn: string = 'all';
  
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  availableColumns: string[] = [];
  
  showDeleteAllConfirm: boolean = false;
  showDeleteConfirm: boolean = false;
  documentToDelete: string = '';

  // Ordem das colunas para exibição
  columnOrder: string[] = [
    'FUNCIONARIO',
    'CENTRO CUSTO',
    'DESCRICAO CC',
    'MES',
    'ANO',
    'SALARIO',
    'SALARIO MES',
    'ADIANTAMENTO',
    'SALARIO LIQUIDO',
    'COMISSAO+DSR',
    'HORAS EXTRAS',
    'BONUS',
    'INSALUBRIDADE',
    'FERIAS',
    'ODONTO',
    'VALE CULTURA',
    'FARMACIA',
    'INSS',
    'INSS13º',
    'INSS FERIAS',
    'SISTEMA S',
    'RAT',
    'FGTS',
    'IRRF',
    'IRRF FERIAS'
  ];

  // Colunas monetárias para formatação
  currencyColumns: string[] = [
    'SALARIO', 'SALÁRIO', 'SALARIO MES', 'SALÁRIO MÊS', 'ADIANTAMENTO',
    'SALARIO LIQUIDO', 'SALÁRIO LÍQUIDO', 'COMISSAO+DSR', 'COMISSÃO+DSR',
    'HORAS EXTRAS', 'BONUS', 'BÔNUS', 'INSALUBRIDADE', 'FERIAS', 'FÉRIAS',
    'ODONTO', 'VALE CULTURA', 'FARMACIA', 'FARMÁCIA', 'INSS', 'INSS13º',
    'INSS FERIAS', 'INSS FÉRIAS', 'SISTEMA S', 'RAT', 'FGTS', 'IRRF', 'IRRF FERIAS', 'IRRF FÉRIAS'
  ];

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
      this.filteredDocuments = [...this.documents];
      
      if (this.documents.length > 0) {
        const allKeys = Object.keys(this.documents[0]).filter(key => 
          key !== 'id' && key !== 'arquivoOrigem' && key !== 'importadoEm'
        );
        
        this.availableColumns = this.columnOrder.filter(col => 
          allKeys.some(k => k.toUpperCase() === col.toUpperCase())
        );
        
        const remainingCols = allKeys.filter(col => 
          !this.columnOrder.some(c => c.toUpperCase() === col.toUpperCase())
        );
        this.availableColumns.push(...remainingCols);
      }
      
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      alert('Erro ao carregar dados. Verifique o console.');
    } finally {
      this.isLoading = false;
    }
  }

  applyFiltersAndSort(): void {
    if (this.searchTerm) {
      this.filteredDocuments = this.documents.filter(doc => {
        if (this.filterColumn === 'all') {
          return Object.values(doc).some(value => 
            String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        } else {
          return String(doc[this.filterColumn]).toLowerCase().includes(this.searchTerm.toLowerCase());
        }
      });
    } else {
      this.filteredDocuments = [...this.documents];
    }

    if (this.sortColumn) {
      this.filteredDocuments.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
        
        let comparison = 0;
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else {
          comparison = String(valueA).localeCompare(String(valueB));
        }
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterColumn = 'all';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFiltersAndSort();
  }

  viewDocument(doc: any): void {
    this.selectedDocument = doc;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedDocument = null;
  }

  confirmDelete(documentId: string): void {
    this.documentToDelete = documentId;
    this.showDeleteConfirm = true;
  }

  async deleteDocument(): Promise<void> {
    if (!this.documentToDelete) return;
    
    try {
      this.isLoading = true;
      await this.firestoreService.deleteDocument(this.collectionName, this.documentToDelete);
      await this.loadDocuments();
      this.showDeleteConfirm = false;
      this.documentToDelete = '';
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento.');
    } finally {
      this.isLoading = false;
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.documentToDelete = '';
  }

  confirmDeleteAll(): void {
    this.showDeleteAllConfirm = true;
  }

  async deleteAllDocuments(): Promise<void> {
    try {
      this.isLoading = true;
      const deletedCount = await this.firestoreService.deleteAllDocuments(this.collectionName);
      alert(`${deletedCount} documento(s) excluído(s) com sucesso!`);
      await this.loadDocuments();
      this.showDeleteAllConfirm = false;
    } catch (error) {
      console.error('Erro ao excluir todos os documentos:', error);
      alert('Erro ao excluir documentos.');
    } finally {
      this.isLoading = false;
    }
  }

  cancelDeleteAll(): void {
    this.showDeleteAllConfirm = false;
  }

  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return '-';
    
    const keyUpper = key.toUpperCase();
    
    const isCurrencyColumn = this.currencyColumns.some(cc => cc.toUpperCase() === keyUpper);
    if (isCurrencyColumn && typeof value === 'number') {
      return this.formatService.formatCurrency(value);
    }
    
    if (typeof value === 'number') {
      return this.formatService.formatNumber(value, 0);
    }
    
    return String(value);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
}
