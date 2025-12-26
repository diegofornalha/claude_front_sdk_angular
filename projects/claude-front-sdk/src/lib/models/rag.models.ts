/**
 * RAG Models - Interfaces para busca e ingestão RAG
 */

export interface SearchRequest {
  query: string;
  top_k?: number;
  threshold?: number;
}

export interface SearchResult {
  content: string;
  source: string;
  score: number;
  chunk_id?: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

export interface Document {
  id: string;
  source: string;
  doc_type: string;
  chunk_count: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface IngestResponse {
  success: boolean;
  document_id?: string;
  chunks?: number;
  error?: string;
}
