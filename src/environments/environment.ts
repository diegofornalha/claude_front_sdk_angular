/**
 * Environment - Development
 * Configurações para ambiente de desenvolvimento local
 * Backend: claude_backend_sdk_hibrid rodando na porta 8234
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8234',
  apiVersion: 'legacy' as const, // Sem prefixo /v1 - endpoints diretos
  apiKey: '', // Não usa API Key - usa JWT do claude_backend_sdk_hibrid
  defaultModel: 'opus' as const,
  streaming: true,
  sessionPersistence: 'localStorage' as const,
  timeout: 60000,
};
