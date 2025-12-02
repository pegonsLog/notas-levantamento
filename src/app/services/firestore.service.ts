import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  where,
  CollectionReference, 
  DocumentData,
  QuerySnapshot,
  writeBatch,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) { }

  /**
   * Adiciona um documento a uma coleção do Firestore
   * @param collectionName Nome da coleção
   * @param data Dados a serem adicionados
   * @returns Promise com o ID do documento criado
   */
  async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      const collectionRef = collection(this.firestore, collectionName) as CollectionReference<DocumentData>;
      const docRef = await addDoc(collectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      throw error;
    }
  }

  /**
   * Adiciona múltiplos documentos a uma coleção do Firestore
   * @param collectionName Nome da coleção
   * @param dataArray Array de dados a serem adicionados
   * @returns Promise com array de IDs dos documentos criados
   */
  async addMultipleDocuments(collectionName: string, dataArray: any[]): Promise<string[]> {
    try {
      const ids: string[] = [];
      const collectionRef = collection(this.firestore, collectionName) as CollectionReference<DocumentData>;
      
      for (const data of dataArray) {
        const docRef = await addDoc(collectionRef, data);
        ids.push(docRef.id);
      }
      
      return ids;
    } catch (error) {
      console.error('Erro ao adicionar múltiplos documentos:', error);
      throw error;
    }
  }

  /**
   * Adiciona múltiplos documentos em lote (batch)
   * @param collectionName Nome da coleção
   * @param dataArray Array de dados a serem adicionados
   * @param batchSize Tamanho do lote (padrão: 500, máximo do Firestore)
   * @param onProgress Callback opcional para reportar progresso (current, total)
   * @returns Promise com número de documentos adicionados
   */
  async addDocumentsInBatch(
    collectionName: string, 
    dataArray: any[], 
    batchSize: number = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    try {
      let totalAdded = 0;
      const total = dataArray.length;
      
      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        await this.addMultipleDocuments(collectionName, batch);
        totalAdded += batch.length;
        
        // Reporta progresso se callback foi fornecido
        if (onProgress) {
          onProgress(totalAdded, total);
        }
      }
      
      return totalAdded;
    } catch (error) {
      console.error('Erro ao adicionar documentos em lote:', error);
      throw error;
    }
  }

  /**
   * Atualiza um documento existente
   * @param collectionName Nome da coleção
   * @param documentId ID do documento
   * @param data Dados para atualização
   * @returns Promise void
   */
  async updateDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os documentos de uma coleção (Observable)
   * @param collectionName Nome da coleção
   * @returns Observable com array de documentos
   */
  getCollection(collectionName: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' });
  }

  /**
   * Obtém todos os documentos de uma coleção (Promise)
   * @param collectionName Nome da coleção
   * @returns Promise com array de documentos
   */
  async getAllDocuments(collectionName: string): Promise<any[]> {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      const documents: any[] = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw error;
    }
  }

  /**
   * Exclui um documento específico
   * @param collectionName Nome da coleção
   * @param documentId ID do documento
   * @returns Promise void
   */
  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  }

  /**
   * Exclui todos os documentos de uma coleção
   * @param collectionName Nome da coleção
   * @returns Promise com número de documentos excluídos
   */
  async deleteAllDocuments(collectionName: string): Promise<number> {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      let deletedCount = 0;
      const batchSize = 500;
      let batch = writeBatch(this.firestore);
      let operationCount = 0;

      for (const document of querySnapshot.docs) {
        batch.delete(document.ref);
        operationCount++;
        deletedCount++;

        // Firestore permite no máximo 500 operações por batch
        if (operationCount === batchSize) {
          await batch.commit();
          batch = writeBatch(this.firestore);
          operationCount = 0;
        }
      }

      // Commit do último batch se houver operações pendentes
      if (operationCount > 0) {
        await batch.commit();
      }

      return deletedCount;
    } catch (error) {
      console.error('Erro ao excluir todos os documentos:', error);
      throw error;
    }
  }

  /**
   * Busca documentos com filtro e ordenação
   * @param collectionName Nome da coleção
   * @param orderByField Campo para ordenação (opcional)
   * @param orderDirection Direção da ordenação (opcional)
   * @returns Promise com array de documentos
   */
  async getDocumentsWithQuery(
    collectionName: string, 
    orderByField?: string, 
    orderDirection: 'asc' | 'desc' = 'asc'
  ): Promise<any[]> {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      let q;

      if (orderByField) {
        q = query(collectionRef, orderBy(orderByField, orderDirection));
      } else {
        q = query(collectionRef);
      }

      const querySnapshot = await getDocs(q);
      const documents: any[] = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      console.error('Erro ao buscar documentos com query:', error);
      throw error;
    }
  }
}
