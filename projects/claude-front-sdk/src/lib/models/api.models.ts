/**
 * API Models - Auto-generated from Pydantic models
 * Generated: 2025-12-29 02:51:48
 *
 * DO NOT EDIT MANUALLY - Run `python scripts/generate_ts_models.py` to regenerate
 */

/**
 * Common API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Session info
 */
export interface SessionInfo {
  session_id: string;
  title: string;
  favorite: boolean;
  project_id: string | null;
  user_id: string | null;
  is_guest: boolean;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tool_calls?: ToolCall[];
}

/**
 * Tool call info
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_ms?: number;
}

/**
 * RAG search result
 */
export interface SearchResult {
  content: string;
  source: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Artifact/Output file
 */
export interface ArtifactFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  session_id?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// From chat
export interface ChatRequest {
  message: string;
  session_id?: string;
  model?: string;
  resume?: boolean;
  fork_session?: boolean;
}

// From chat
export interface ChatResponse {
  response: string;
}

// From mcp
export interface AdapterInfo {
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  status: string;
  tools?: string;
}

// From mcp
export interface IngestRequest {
  queries?: string;
  include_examples?: boolean;
  include_best_practices?: boolean;
}

// From mcp
export interface IngestResult {
  success: boolean;
  documents_ingested?: number;
  errors?: string;
  duration_seconds?: number;
}

// From mcp
export interface MCPStatus {
  available: boolean;
  adapters_registered: number;
  adapters_enabled: number;
  adapters_connected: number;
  enabled_list?: string;
}
