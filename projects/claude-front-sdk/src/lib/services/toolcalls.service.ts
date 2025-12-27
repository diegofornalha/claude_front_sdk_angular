import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToolCall, AuditStats, DebugResponse } from '../models/toolcalls.models';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

/**
 * ToolCallsService - Rastreia tool calls do Claude em tempo real
 * Mostra "o que está acontecendo nos bastidores" + audit dashboard
 */
@Injectable({
  providedIn: 'root'
})
export class ToolCallsService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private logger = inject(LoggerService);

  // Signals para tool calls em tempo real
  recentToolCalls = signal<ToolCall[]>([]);
  isPolling = signal(false);
  private pollingInterval: any;

  // Signals para audit stats
  stats = signal<AuditStats | null>(null);
  debug = signal<DebugResponse | null>(null);

  // Session ID atual para filtragem
  private currentSessionId: string | null = null;

  /**
   * Define o sessionId para filtragem
   */
  setSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Busca tool calls recentes do backend
   */
  async getRecent(limit = 10, sessionId?: string | null): Promise<ToolCall[]> {
    const sid = sessionId ?? this.currentSessionId;
    let url = `${this.config.apiUrl}/audit/tools?limit=${limit}`;
    if (sid) {
      url += `&session_id=${sid}`;
    }
    const response = await firstValueFrom(
      this.http.get<any>(url)
    );
    // Backend retorna 'recent' não 'tool_calls'
    const toolCalls = response.recent || response.tool_calls || [];
    this.recentToolCalls.set(toolCalls);
    return toolCalls;
  }

  /**
   * Busca estatísticas de audit
   */
  async getStats(sessionId?: string | null): Promise<AuditStats | null> {
    try {
      const sid = sessionId ?? this.currentSessionId;
      let url = `${this.config.apiUrl}/audit/stats`;
      if (sid) {
        url += `?session_id=${sid}`;
      }
      const response = await firstValueFrom(
        this.http.get<AuditStats>(url)
      );
      this.stats.set(response);
      return response;
    } catch (error) {
      this.logger.error('ToolCallsService', 'Erro ao buscar stats:', error);
      return null;
    }
  }

  /**
   * Busca logs de debug para uma sessão
   */
  async getDebug(sessionId: string): Promise<DebugResponse | null> {
    try {
      const url = `${this.config.apiUrl}/audit/debug/${sessionId}`;
      const response = await firstValueFrom(
        this.http.get<DebugResponse>(url)
      );
      this.debug.set(response);
      return response;
    } catch (error) {
      this.logger.error('ToolCallsService', 'Erro ao buscar debug:', error);
      return null;
    }
  }

  /**
   * Inicia polling para atualizar tool calls e stats em tempo real
   */
  startPolling(intervalMs = 1000): void {
    if (this.isPolling()) return;

    this.isPolling.set(true);
    this.pollingInterval = setInterval(async () => {
      try {
        await Promise.all([
          this.getRecent(),
          this.getStats()
        ]);
      } catch (error) {
        this.logger.error('ToolCallsService', 'Erro no polling:', error);
      }
    }, intervalMs);

    // Busca inicial imediata
    this.getRecent();
    this.getStats();
  }

  /**
   * Para polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling.set(false);
  }

  /**
   * Limpa tool calls
   */
  clear(): void {
    this.recentToolCalls.set([]);
    this.stats.set(null);
    this.debug.set(null);
  }
}
