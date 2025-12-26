/**
 * Chat Models - Interfaces para Chat com Claude RAG
 */

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  citations?: Citation[];
}

export interface Citation {
  source: string;
  content: string;
  score?: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  model?: 'haiku' | 'sonnet' | 'opus';
}

export interface ChatResponse {
  response: string;
  citations?: Citation[];
}

export interface StreamChunk {
  text?: string;
  citations?: Citation[];
  error?: string;
  done?: boolean;
  session_id?: string;
}
