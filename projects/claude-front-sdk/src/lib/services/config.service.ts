import { Injectable, InjectionToken, inject, Optional } from '@angular/core';
import { ClaudeConfig, DEFAULT_CONFIG } from '../models/config.models';

/**
 * Injection token para configuração do SDK
 */
export const CLAUDE_CONFIG = new InjectionToken<Partial<ClaudeConfig>>('claude.config');

/**
 * ConfigService - Gerencia configuração do SDK
 */
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private configToken = inject(CLAUDE_CONFIG, { optional: true });
  private config: ClaudeConfig;

  constructor() {
    this.config = {
      ...DEFAULT_CONFIG,
      ...(this.configToken || {}),
    };
  }

  setConfig(config: Partial<ClaudeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ClaudeConfig {
    return { ...this.config };
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get apiKey(): string | undefined {
    return this.config.apiKey;
  }

  get apiVersion(): string {
    return this.config.apiVersion || 'v1';
  }

  /**
   * Retorna a URL base com prefixo de versão
   * Exemplo: http://localhost:8001/v1
   */
  getBaseUrl(): string {
    const base = this.config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    const version = this.config.apiVersion;
    return version === 'legacy' ? base : `${base}/${version}`;
  }

  /**
   * Constrói URL completa para um endpoint
   * Exemplo: buildUrl('/sessions') => http://localhost:8001/v1/sessions
   */
  buildUrl(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.getBaseUrl()}${path}`;
  }
}

/**
 * Provider function para configurar o SDK
 */
export function provideClaude(config: Partial<ClaudeConfig>) {
  return {
    provide: CLAUDE_CONFIG,
    useValue: config,
  };
}
