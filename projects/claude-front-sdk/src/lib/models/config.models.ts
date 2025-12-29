/**
 * Config Models - Configuração do SDK
 *
 * NOTA: apiUrl deve ser fornecido via provideClaude() usando environments.
 * O valor padrão vazio força configuração explícita.
 */

export interface ClaudeConfig {
  apiUrl: string;
  apiKey?: string;
  apiVersion?: 'v1' | 'legacy';
  streaming?: boolean;
  sessionPersistence?: 'localStorage' | 'sessionStorage' | 'none';
  defaultModel?: 'haiku' | 'sonnet' | 'opus';
  timeout?: number;
}

export const DEFAULT_CONFIG: ClaudeConfig = {
  apiUrl: '', // Deve ser configurado via environment
  apiVersion: 'v1', // Usar API versionada por padrão
  streaming: true,
  sessionPersistence: 'localStorage',
  defaultModel: 'haiku',
  timeout: 30000,
};
