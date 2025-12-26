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
  providedIn: 'root'
})
export class ConfigService {
  private configToken = inject(CLAUDE_CONFIG, { optional: true });
  private config: ClaudeConfig;

  constructor() {
    this.config = {
      ...DEFAULT_CONFIG,
      ...(this.configToken || {})
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
}

/**
 * Provider function para configurar o SDK
 */
export function provideClaude(config: Partial<ClaudeConfig>) {
  return {
    provide: CLAUDE_CONFIG,
    useValue: config
  };
}
