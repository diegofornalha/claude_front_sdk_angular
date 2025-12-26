import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Session, SessionInfo, SessionListResponse, ResetResponse } from '../models/session.models';
import { ConfigService } from './config.service';

/**
 * SessionService - Gerencia sessões do Claude RAG
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  currentSession = signal<SessionInfo | null>(null);
  sessions = signal<Session[]>([]);
  isLoading = signal(false);

  /**
   * Obtém sessão atual
   */
  async getCurrent(): Promise<SessionInfo> {
    const url = `${this.config.apiUrl}/session/current`;
    const session = await firstValueFrom(this.http.get<SessionInfo>(url));
    this.currentSession.set(session);
    return session;
  }

  /**
   * Lista todas as sessões
   */
  async list(): Promise<Session[]> {
    this.isLoading.set(true);
    try {
      const url = `${this.config.apiUrl}/sessions`;
      console.log('[SessionService] Buscando sessões:', url);
      const response = await firstValueFrom(this.http.get<SessionListResponse>(url));
      console.log('[SessionService] Resposta:', response);
      this.sessions.set(response.sessions);
      return response.sessions;
    } catch (error) {
      console.error('[SessionService] Erro ao buscar sessões:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cria nova sessão (reset)
   */
  async reset(): Promise<ResetResponse> {
    const config = this.config.getConfig();
    const url = `${config.apiUrl}/reset`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Project': 'chat-angular'
    };

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ project: 'chat-angular' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await this.getCurrent();
    return data;
  }

  /**
   * Deleta sessão
   */
  async delete(sessionId: string, skipRefresh = false): Promise<void> {
    const url = `${this.config.apiUrl}/sessions/${sessionId}`;
    await firstValueFrom(this.http.delete(url));
    if (!skipRefresh) {
      await this.list();
    }
  }

  /**
   * Deleta múltiplas sessões (mais eficiente que deletar uma por uma)
   */
  async deleteBulk(sessionIds: string[]): Promise<void> {
    for (const id of sessionIds) {
      try {
        await this.delete(id, true);  // skip refresh
      } catch (error) {
        console.error(`[SessionService] Erro ao deletar ${id}:`, error);
      }
    }
    await this.list();  // refresh only once at the end
  }

  /**
   * Renomeia uma sessão (atualiza título)
   */
  async rename(sessionId: string, title: string): Promise<void> {
    const config = this.config.getConfig();
    const url = `${config.apiUrl}/sessions/${sessionId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Refresh sessions list
    await this.list();
  }

  /**
   * Define/remove favorito de uma sessão
   */
  async setFavorite(sessionId: string, favorite: boolean): Promise<void> {
    const config = this.config.getConfig();
    const url = `${config.apiUrl}/sessions/${sessionId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ favorite })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Refresh sessions list
    await this.list();
  }

  /**
   * Adiciona/remove sessão de um projeto
   */
  async setProject(sessionId: string, projectId: string | null): Promise<void> {
    const config = this.config.getConfig();
    const url = `${config.apiUrl}/sessions/${sessionId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ project_id: projectId })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Refresh sessions list
    await this.list();
  }
}
