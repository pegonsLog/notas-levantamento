import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { NomeRazao } from '../../models/nome-razao.interface';

@Component({
  selector: 'app-nome-razao-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nome-razao-manager.component.html',
  styleUrl: './nome-razao-manager.component.scss'
})
export class NomeRazaoManagerComponent implements OnInit {
  collectionName: string = 'nome-razao';
  items: (NomeRazao & { id?: string })[] = [];
  filteredItems: (NomeRazao & { id?: string })[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';

  // Modal principal (criação/edição)
  showModal: boolean = false;
  isEditing: boolean = false;
  currentItem: NomeRazao & { id?: string } = {
    nomePessoaFisica: '',
    nomeRazaoSocial: '',
    status: 'Ativo'
  };

  // Modal de confirmação de exclusão
  showDeleteConfirm: boolean = false;
  itemToDeleteId: string = '';

  constructor(private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.loadItems();
  }

  /**
   * Carrega todos os registros da coleção
   */
  async loadItems(): Promise<void> {
    try {
      this.isLoading = true;
      const docs = await this.firestoreService.getAllDocuments(this.collectionName);
      this.items = docs as (NomeRazao & { id?: string })[];
      this.applyFilter();
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      alert('Erro ao carregar itens. Verifique o console.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Aplica filtro por texto
   */
  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredItems = [...this.items];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.nomePessoaFisica.toLowerCase().includes(term) ||
      item.nomeRazaoSocial.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term)
    );
  }

  /**
   * Limpa filtros
   */
  clearFilter(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  /**
   * Abre modal para novo registro ou edição
   */
  openModal(item?: NomeRazao & { id?: string }): void {
    this.isEditing = !!item;

    if (item) {
      this.currentItem = { ...item };
    } else {
      this.currentItem = {
        nomePessoaFisica: '',
        nomeRazaoSocial: '',
        status: 'Ativo'
      };
    }

    this.showModal = true;
  }

  /**
   * Fecha modal
   */
  closeModal(): void {
    this.showModal = false;
  }

  /**
   * Salva (cria ou atualiza) registro
   */
  async saveItem(): Promise<void> {
    try {
      this.isLoading = true;

      const { id, ...data } = this.currentItem;

      if (this.isEditing && id) {
        await this.firestoreService.updateDocument(this.collectionName, id, data);
      } else {
        await this.firestoreService.addDocument(this.collectionName, data);
      }

      this.closeModal();
      await this.loadItems();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Abre modal de confirmação de exclusão
   */
  confirmDelete(id: string): void {
    this.itemToDeleteId = id;
    this.showDeleteConfirm = true;
  }

  /**
   * Cancela exclusão
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.itemToDeleteId = '';
  }

  /**
   * Exclui registro selecionado
   */
  async deleteItem(): Promise<void> {
    if (!this.itemToDeleteId) return;

    try {
      this.isLoading = true;
      await this.firestoreService.deleteDocument(this.collectionName, this.itemToDeleteId);
      this.showDeleteConfirm = false;
      this.itemToDeleteId = '';
      await this.loadItems();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item.');
    } finally {
      this.isLoading = false;
    }
  }
}
