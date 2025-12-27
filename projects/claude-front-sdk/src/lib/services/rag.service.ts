import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SearchRequest, SearchResponse, Document, DocumentListResponse } from '../models/rag.models';
import { ConfigService } from './config.service';

/**
 * RAGService - Gerencia busca e documentos RAG
 */
@Injectable({
  providedIn: 'root'
})
export class RAGService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  documents = signal<Document[]>([]);
  isSearching = signal(false);

  /**
   * Busca semântica
   */
  async search(query: string, topK = 5): Promise<SearchResponse> {
    this.isSearching.set(true);
    try {
      const url = `${this.config.apiUrl}/rag/search`;
      const request: SearchRequest = { query, top_k: topK };
      return await firstValueFrom(this.http.post<SearchResponse>(url, request));
    } finally {
      this.isSearching.set(false);
    }
  }

  /**
   * Lista documentos
   */
  async listDocuments(): Promise<Document[]> {
    const url = `${this.config.apiUrl}/rag/documents`;
    const response = await firstValueFrom(this.http.get<DocumentListResponse>(url));
    this.documents.set(response.documents);
    return response.documents;
  }

  /**
   * Deleta documento
   */
  async deleteDocument(docId: string): Promise<void> {
    const url = `${this.config.apiUrl}/rag/documents/${docId}`;
    await firstValueFrom(this.http.delete(url));
    await this.listDocuments();
  }
}
