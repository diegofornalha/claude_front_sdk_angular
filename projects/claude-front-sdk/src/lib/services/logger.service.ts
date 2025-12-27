import { Injectable, inject, InjectionToken, isDevMode } from '@angular/core';

/**
 * Injection token para configurar se logs estão habilitados
 */
export const LOGGER_ENABLED = new InjectionToken<boolean>('logger.enabled', {
  providedIn: 'root',
  factory: () => isDevMode()
});

/**
 * LoggerService - Centraliza logs para evitar console.log em produção
 *
 * Em produção: apenas error() e warn() funcionam
 * Em desenvolvimento: todos os métodos funcionam
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private enabled = inject(LOGGER_ENABLED);

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(context: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.debug(`[${context}]`, ...args);
    }
  }

  /**
   * Log informativo - apenas em desenvolvimento
   */
  info(context: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.info(`[${context}]`, ...args);
    }
  }

  /**
   * Log de aviso - sempre habilitado
   */
  warn(context: string, ...args: unknown[]): void {
    console.warn(`[${context}]`, ...args);
  }

  /**
   * Log de erro - sempre habilitado
   */
  error(context: string, ...args: unknown[]): void {
    console.error(`[${context}]`, ...args);
  }

  /**
   * Log de grupo - apenas em desenvolvimento
   */
  group(label: string): void {
    if (this.enabled) {
      console.group(label);
    }
  }

  /**
   * Fecha grupo - apenas em desenvolvimento
   */
  groupEnd(): void {
    if (this.enabled) {
      console.groupEnd();
    }
  }
}
