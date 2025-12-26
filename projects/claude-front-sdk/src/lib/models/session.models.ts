/**
 * Session Models - Interfaces para gerenciamento de sessões
 */

export interface Session {
  session_id: string;
  title?: string | null;  // Título customizado (opcional)
  favorite?: boolean;  // Favorito
  project_id?: string | null;  // Projeto atribuído
  file: string;
  file_name: string;
  db_file: string;
  db_size: number;
  updated_at: number;
  is_current: boolean;
  message_count: number;
  has_outputs: boolean;
  output_count: number;
  model: string;
}

export interface SessionInfo {
  active: boolean;
  session_id: string | null;
  info?: any;
  has_outputs?: boolean;
  output_count?: number;
  outputs?: string[];
  message?: string;
}

export interface SessionListResponse {
  count: number;
  sessions: Session[];
}

export interface ResetResponse {
  status: string;
  message: string;
  old_session_id: string | null;
  new_session_id: string;
}
