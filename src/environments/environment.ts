/**
 * Environment - Development
 * Configurações para ambiente de desenvolvimento local
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001',
  apiKey: 'rag_ol8q9wJtY4ERFjBdgFH2BKgCXqQl3qMqa8cWmuQXw1k', // API Key do backend (claude_rag_sdk/.env)
  defaultModel: 'haiku' as const,
  streaming: true,
  sessionPersistence: 'localStorage' as const,
  timeout: 30000,
};
