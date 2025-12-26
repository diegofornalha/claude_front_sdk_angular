/**
 * Config Models - Configuração do SDK
 */

export interface ClaudeConfig {
  apiUrl: string;
  apiKey?: string;
  streaming?: boolean;
  sessionPersistence?: 'localStorage' | 'sessionStorage' | 'none';
  defaultModel?: 'haiku' | 'sonnet' | 'opus';
  timeout?: number;
}

export const DEFAULT_CONFIG: ClaudeConfig = {
  apiUrl: 'http://localhost:8001',
  streaming: true,
  sessionPersistence: 'localStorage',
  defaultModel: 'haiku',
  timeout: 30000
};
