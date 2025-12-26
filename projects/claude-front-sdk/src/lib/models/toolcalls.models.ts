/**
 * Tool Calls Models - Rastreamento de ferramentas do Claude
 */

export interface ToolCall {
  id: number;
  name: string;
  input?: any;
  output?: any;
  parameters?: any;
  status: 'running' | 'success' | 'error' | 'pending';
  started_at: number;
  ended_at?: number;
  duration?: number;
  duration_ms?: number;
  error?: string;
  error_message?: string;
}

export interface ToolCallsResponse {
  tool_calls: ToolCall[];
  recent: ToolCall[];
  total: number;
  count: number;
}

export interface ToolCallStats {
  total_calls: number;
  successful: number;
  failed: number;
  average_duration: number;
  by_tool: Record<string, number>;
}

/**
 * Audit Stats - Métricas do audit dashboard
 */
export interface AuditStats {
  session_id: string;
  total_calls: number;
  errors: number;
  avg_duration_ms: number;
  by_tool: Record<string, number>;
}

/**
 * Debug Entry - Logs de debug do CLI
 */
export interface DebugEntry {
  timestamp: string;
  message: string;
  event_type?: string;
  tool_name?: string;
}

export interface DebugSummary {
  total_events: number;
  tool_events: number;
  file_writes: number;
  streams: number;
}

export interface DebugResponse {
  found: boolean;
  count: number;
  session_id: string;
  summary: DebugSummary;
  entries: DebugEntry[];
}
