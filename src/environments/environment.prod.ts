/**
 * Environment - Production
 * Configurações para ambiente de produção
 */
export const environment = {
  production: true,
  apiUrl: '/api', // Proxy reverso em produção
  apiKey: '', // Gerenciado via backend em produção
  defaultModel: 'haiku' as const,
  streaming: true,
  sessionPersistence: 'localStorage' as const,
  timeout: 30000,
};
