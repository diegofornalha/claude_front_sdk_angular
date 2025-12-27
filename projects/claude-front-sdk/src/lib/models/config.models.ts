/**
 * Config Models - Configuração do SDK
 *
 * NOTA: apiUrl deve ser fornecido via provideClaude() usando environments.
 * O valor padrão vazio força configuração explícita.
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
  apiUrl: '', // Deve ser configurado via environment
  streaming: true,
  sessionPersistence: 'localStorage',
  defaultModel: 'haiku',
  timeout: 30000,
};
