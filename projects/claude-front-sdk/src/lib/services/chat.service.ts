import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChatMessage, ChatRequest, StreamChunk } from '../models/chat.models';
import { ConfigService } from './config.service';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';

/**
 * ChatService - Gerencia chat com Claude usando Signals e SSE Streaming
 * Segue padrões do Angular AI SDK para streaming com LLMs
 */
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private sessionService = inject(SessionService);
  private logger = inject(LoggerService);

  // Signals para estado reativo
  messages = signal<ChatMessage[]>([]);
  input = signal('');
  isStreaming = signal(false);
  error = signal<string | null>(null);
  currentSessionId = signal<string | null>(null);
  currentModel = signal<'haiku' | 'sonnet' | 'opus'>('opus');

  // ANTI-DUPLICAÇÃO: Flag para prevenir reload durante transição /new → /chat
  private skipNextLoad = signal(false);

  // Computed signal para histórico formatado
  chatHistory = computed(() => {
    return this.messages().map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  });

  /**
   * Envia mensagem para o backend com streaming SSE
   */
  async send(): Promise<void> {
    const userMessage = this.input().trim();
    if (!userMessage || this.isStreaming()) return;

    // Verifica se é nova sessão (para atualizar sidebar depois)
    const isNewSession = this.messages().length === 0;

    // Adiciona mensagem do usuário
    this.messages.update(msgs => [
      ...msgs,
      {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      },
    ]);

    this.input.set('');
    this.isStreaming.set(true);
    this.error.set(null);

    try {
      await this.streamChat(userMessage);

      // Se era nova sessão, atualiza lista de sessões na sidebar
      if (isNewSession) {
        this.sessionService
          .list()
          .catch(err => this.logger.error('ChatService', 'Erro ao atualizar sessões:', err));
      }
    } catch (err: any) {
      this.error.set(err.message || 'Erro ao processar mensagem');
      this.logger.error('ChatService', 'Erro:', err);
    } finally {
      this.isStreaming.set(false);
    }
  }

  /**
   * Streaming SSE do backend
   */
  private async streamChat(message: string): Promise<void> {
    const config = this.config.getConfig();
    const url = this.config.buildUrl('/chat/stream');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Project': 'chat-angular',
    };

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    // NÃO gera session_id - deixa o backend gerar via ClaudeSDKClient
    // O backend extrai o session_id do JSONL criado pelo Claude Code

    const request: ChatRequest = {
      message,
      // Só envia session_id se já tiver (sessão existente)
      // Para novo chat, deixa undefined para o backend gerar
      session_id: this.currentSessionId() || undefined,
      model: this.currentModel(),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body vazia');
    }

    // Processar SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    const assistantMessageId = Date.now().toString();

    // Adiciona mensagem vazia do assistente
    this.messages.update(msgs => [
      ...msgs,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // Buscar session_id do backend se ainda não tiver
              if (!this.currentSessionId()) {
                await this.fetchCurrentSessionId();
              }

              // ANTI-DUPLICAÇÃO: Ativar flag para pular próximo loadSession()
              this.skipNextLoad.set(true);
              this.logger.debug('ChatService', 'Streaming finalizado - flag skipNextLoad ativada');

              return;
            }

            try {
              const parsed: StreamChunk = JSON.parse(data);

              // Captura session_id da resposta
              if (parsed.session_id && !this.currentSessionId()) {
                this.currentSessionId.set(parsed.session_id);
              }

              if (parsed.text) {
                assistantMessage += parsed.text;

                // Atualiza mensagem do assistente
                this.messages.update(msgs =>
                  msgs.map(msg =>
                    msg.id === assistantMessageId ? { ...msg, content: assistantMessage } : msg
                  )
                );
              }

              // Se recebeu sinal para recarregar sessões (após comando de gerenciamento)
              if (parsed.refresh_sessions) {
                this.logger.debug(
                  'ChatService',
                  'Recarregando sessões após comando:',
                  parsed.command
                );
                this.sessionService
                  .list()
                  .catch(err =>
                    this.logger.error('ChatService', 'Erro ao recarregar sessões:', err)
                  );
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              // Ignora erros de parse de chunks incompletos
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Busca session_id atual do backend via /session/current
   */
  private async fetchCurrentSessionId(): Promise<void> {
    try {
      const config = this.config.getConfig();
      const url = this.config.buildUrl('/session/current');

      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.session_id) {
          this.currentSessionId.set(data.session_id);
          this.logger.debug('ChatService', 'Session ID obtido do backend:', data.session_id);
        }
      }
    } catch (err) {
      this.logger.error('ChatService', 'Erro ao buscar session_id:', err);
    }
  }

  /**
   * Limpa histórico de mensagens
   */
  clear(): void {
    this.messages.set([]);
    this.error.set(null);
  }

  /**
   * Remove última mensagem
   */
  removeLastMessage(): void {
    this.messages.update(msgs => msgs.slice(0, -1));
  }

  /**
   * Define sessão atual
   */
  setSession(sessionId: string | null): void {
    this.currentSessionId.set(sessionId);
  }

  /**
   * Carrega sessão com histórico de mensagens do backend
   * @param sessionId - ID da sessão
   * @param forceReload - Se true, recarrega mesmo se já tiver mensagens
   */
  async loadSession(sessionId: string, forceReload = false): Promise<void> {
    // Validar sessionId (aceita UUID padrão ou formato user_{id}_session_{timestamp}_{hash})
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const customIdRegex = /^user_\d+_session_\d+_[0-9a-f]+$/i;
    if (!uuidRegex.test(sessionId) && !customIdRegex.test(sessionId)) {
      this.logger.warn('ChatService', `SessionId inválido ignorado: ${sessionId}`);
      return;
    }

    const previousSessionId = this.currentSessionId();
    const isSameSession = previousSessionId === sessionId;
    const hasExistingMessages = this.messages().length > 0;

    this.currentSessionId.set(sessionId);
    this.error.set(null);

    // CORREÇÃO ANTI-DUPLICAÇÃO:
    // 1. Se streaming está ativo, NUNCA recarregar
    if (this.isStreaming() && !forceReload) {
      this.logger.debug('ChatService', 'Streaming ativo - bloqueando reload');
      return;
    }

    // 2. Se flag skipNextLoad ativa E mesma sessão (streaming acabou de terminar)
    if (this.skipNextLoad() && isSameSession && !forceReload) {
      this.logger.debug('ChatService', 'Pulando reload - acabou de fazer streaming');
      this.skipNextLoad.set(false);
      return;
    }

    // 3. Se MESMA sessão e já tem mensagens, não recarregar
    // MAS se MUDOU de sessão, DEVE recarregar!
    if (isSameSession && hasExistingMessages && !forceReload) {
      this.logger.debug('ChatService', 'Mesma sessão com mensagens - evitando duplicação');
      return;
    }

    // Se mudou de sessão, limpa flag de skip
    if (!isSameSession) {
      this.skipNextLoad.set(false);
      this.logger.debug(
        'ChatService',
        `Mudou de sessão: ${previousSessionId?.slice(0, 8)} → ${sessionId.slice(0, 8)}`
      );
    }

    // Limpa e recarrega
    this.messages.set([]);

    try {
      const config = this.config.getConfig();
      const url = this.config.buildUrl(`/sessions/${sessionId}/messages`);

      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          // Sessão não encontrada, manter vazio
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const loadedMessages: ChatMessage[] = (data.messages || []).map((msg: any, index: number) => {
        // Normaliza content - pode ser string ou array de blocos [{type: "text", text: "..."}]
        let content = msg.content;
        if (Array.isArray(content)) {
          content = content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('');
        }

        return {
          id: `${sessionId}-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: content || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
        };
      });

      this.messages.set(loadedMessages);
    } catch (err: any) {
      this.logger.error('ChatService', 'Erro ao carregar sessão:', err);
      this.error.set(err.message || 'Erro ao carregar histórico');
    }
  }

  /**
   * Define modelo atual
   */
  setModel(model: 'haiku' | 'sonnet' | 'opus'): void {
    this.currentModel.set(model);
  }
}
