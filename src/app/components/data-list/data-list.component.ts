import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-list.component.html',
  styleUrl: './data-list.component.scss'
})
export class DataListComponent implements OnInit {
  collectionName: string = 'notas-levantamento';
  documents: any[] = [];
  filteredDocuments: any[] = [];
  isLoading: boolean = false;
  
  // Modal
  showModal: boolean = false;
  selectedDocument: any = null;
  
  // Filtros
  searchTerm: string = '';
  filterColumn: string = 'all';
  
  // Ordenação
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Colunas disponíveis (será preenchido dinamicamente)
  availableColumns: string[] = [];
  
  // Confirmação de exclusão
  showDeleteAllConfirm: boolean = false;
  showDeleteConfirm: boolean = false;
  documentToDelete: string = '';

  constructor(
    private firestoreService: FirestoreService,
    public formatService: FormatService
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
  }

  /**
   * Carrega todos os documentos da coleção
   */
  async loadDocuments(): Promise<void> {
    try {
      this.isLoading = true;
      this.documents = await this.firestoreService.getAllDocuments(this.collectionName);
      this.filteredDocuments = [...this.documents];
      
      // Define ordem específica das colunas
      const columnOrder = [
        'CLIFOR',
        'NOME CLIFOR',
        'CNPJ',
        'TIPO',
        'NF',
        'SERIE',
        'VALOR UNIT.',
        'TOTAL BRUTO',
        'TOTAL',
        'DESCONTO',
        'EMISSÃO',
        'DATA DIGITACAO',
        'NRCM',
        'PRODUTO',
        'TIPO PRODUTO',
        'QTD',
        'CUSTO',
        'CFOP',
        'CST',
        'ALIQ. CSLL TERCEIRO',
        'VALOR CSLL TERCEIRO',
        'ALIQ. PIS TERCEIRO',
        'VALOR PIS TERCEIRO',
        'ALIQ. COFINS TERCEIRO',
        'VALOR COFINS TERCEIRO',
        'ICMS',
        'ALIQ. INSS',
        'VALOR INSS',
        'ALIQ. IRRF',
        'VALOR IRRF'
      ];
      
      // Extrai colunas disponíveis do primeiro documento
      if (this.documents.length > 0) {
        const allKeys = Object.keys(this.documents[0]).filter(key => 
          key !== 'id' && 
          key !== 'arquivoOrigem' && 
          key !== 'importadoEm'
        );
        
        // Ordena as colunas de acordo com columnOrder
        this.availableColumns = columnOrder.filter(col => allKeys.includes(col));
        
        // Adiciona colunas que não estão na ordem definida (caso existam)
        const remainingCols = allKeys.filter(col => !columnOrder.includes(col));
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

  /**
   * Aplica filtros e ordenação
   */
  applyFiltersAndSort(): void {
    // Filtrar
    if (this.searchTerm) {
      this.filteredDocuments = this.documents.filter(doc => {
        if (this.filterColumn === 'all') {
          // Busca em todas as colunas
          return Object.values(doc).some(value => 
            String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        } else {
          // Busca em coluna específica
          return String(doc[this.filterColumn]).toLowerCase().includes(this.searchTerm.toLowerCase());
        }
      });
    } else {
      this.filteredDocuments = [...this.documents];
    }

    // Ordenar
    if (this.sortColumn) {
      this.filteredDocuments.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
        
        // Tratamento para diferentes tipos
        let comparison = 0;
        
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else if (valueA instanceof Date && valueB instanceof Date) {
          comparison = valueA.getTime() - valueB.getTime();
        } else {
          comparison = String(valueA).localeCompare(String(valueB));
        }
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
  }

  /**
   * Altera a ordenação
   */
  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  /**
   * Limpa filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.filterColumn = 'all';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFiltersAndSort();
  }

  /**
   * Abre modal com detalhes do documento
   */
  viewDocument(doc: any): void {
    this.selectedDocument = doc;
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedDocument = null;
  }

  /**
   * Confirma exclusão de um documento
   */
  confirmDelete(documentId: string): void {
    this.documentToDelete = documentId;
    this.showDeleteConfirm = true;
  }

  /**
   * Exclui um documento específico
   */
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

  /**
   * Cancela exclusão
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.documentToDelete = '';
  }

  /**
   * Confirma exclusão de todos os documentos
   */
  confirmDeleteAll(): void {
    this.showDeleteAllConfirm = true;
  }

  /**
   * Exclui todos os documentos
   */
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

  /**
   * Cancela exclusão de todos
   */
  cancelDeleteAll(): void {
    this.showDeleteAllConfirm = false;
  }

  /**
   * Formata valor para exibição
   */
  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return '-';
    
    const keyUpper = key.toUpperCase();
    
    // Verifica se é coluna de data pelo nome
    const isDateColumn = keyUpper.includes('EMISSÃO') || 
                        keyUpper.includes('EMISSAO') || 
                        keyUpper.includes('DATA');
    
    // Verifica se é Timestamp do Firestore ou Date
    if (isDateColumn || value instanceof Date || (value.seconds !== undefined && value.nanoseconds !== undefined)) {
      let date: Date;
      
      if (value instanceof Date) {
        date = value;
      } else if (value.seconds !== undefined) {
        // Firestore Timestamp
        date = new Date(value.seconds * 1000);
      } else if (typeof value === 'string' && value.includes('/')) {
        // String no formato dd/mm/yyyy
        return value;
      } else {
        date = new Date(value);
      }
      
      return this.formatService.formatDate(date);
    }
    
    // Verifica se é CNPJ, CLIFOR ou outros IDs (sem decimais)
    if (typeof value === 'number' && (keyUpper.includes('CNPJ') || keyUpper.includes('CLIFOR') || keyUpper.includes('NF') || keyUpper.includes('SERIE'))) {
      return Math.floor(value).toString();
    }
    
    // Verifica se é número que parece ser moeda (baseado no nome da coluna)
    if (typeof value === 'number' && (keyUpper.includes('VALOR') || keyUpper.includes('PRECO') || keyUpper.includes('TOTAL') || keyUpper.includes('CUSTO'))) {
      return this.formatService.formatCurrency(value);
    }
    
    // Verifica se é número
    if (typeof value === 'number') {
      return this.formatService.formatNumber(value, 0);
    }
    
    return String(value);
  }

  /**
   * Obtém ícone de ordenação
   */
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
}
