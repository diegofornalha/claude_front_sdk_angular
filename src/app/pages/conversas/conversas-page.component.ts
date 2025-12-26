import { Component, signal, inject, OnInit, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../../projects/claude-front-sdk/src/lib/services/session.service';
import { Session } from '../../../../projects/claude-front-sdk/src/lib/models/session.models';

interface Conversa {
  id: string;
  uniqueId: string;  // ID único para o track (session_id + tipo)
  titulo: string;
  ultimaMensagem: string;
  messageCount: number;
  model: string;
  isJsonl: boolean;  // true = JSONL, false = AgentFS DB
  file: string;      // Nome do arquivo original
  projectFolder: string;  // Pasta do projeto (extraída do file path)
  isFirst: boolean;  // Primeira sessão = sessão atual
}

@Component({
  selector: 'app-conversas-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="conversas-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Recentes</h1>
        <button class="new-chat-btn" routerLink="/new">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo bate-papo
        </button>
      </div>

      <!-- Search -->
      <div class="search-container">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Procurar nas suas conversas..."
          class="search-input"
        />
      </div>

      <!-- Counter -->
      <div class="counter-row">
        <span class="counter-text">{{ conversas().length }} chats com Claude</span>
        @if (conversas().length > 0) {
          <button class="select-btn" (click)="toggleSelectMode()">
            {{ isSelectMode() ? 'Cancelar' : 'Selecionar' }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Carregando conversas...</span>
        </div>
      } @else {
        <!-- Conversations List -->
        <div class="conversas-list">
          @for (conversa of filteredConversas(); track conversa.uniqueId) {
            <div class="conversa-item" [class.selected]="isSelected(conversa.id)">
              @if (isSelectMode()) {
                <label class="checkbox-container">
                  <input type="checkbox" [checked]="isSelected(conversa.id)" (change)="toggleSelect(conversa.id)" />
                  <span class="checkmark"></span>
                </label>
              }

              <div class="conversa-content" [routerLink]="['/chat', conversa.id]">
                <div class="conversa-header">
                  <span class="conversa-project">🗂️ {{ conversa.projectFolder }}</span>
                  <span class="conversa-titulo">{{ conversa.titulo }}</span>
                  @if (conversa.isFirst) {
                    <span class="badge-atual">✨ Atual</span>
                  }
                  <span class="conversa-model">{{ conversa.model }}</span>
                </div>
                <div class="conversa-meta">
                  <span class="conversa-messages">{{ conversa.messageCount }} mensagens</span>
                  <span class="conversa-time">{{ conversa.ultimaMensagem }}</span>
                </div>
              </div>

              <div class="menu-container">
                <button class="menu-btn" (click)="openMenu(conversa.uniqueId, $event)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>

                @if (activeMenuId() === conversa.uniqueId) {
                  <div class="menu-dropdown" (click)="$event.stopPropagation()">
                    <button class="menu-item" (click)="goToAudit(conversa.id, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                      Auditoria
                    </button>
                    <button class="menu-item delete" (click)="deleteSingle(conversa.id, $event)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Apagar
                    </button>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p>Nenhuma conversa ainda</p>
              <span>Inicie um novo bate-papo para comecar</span>
            </div>
          }
        </div>
      }

      <!-- Selection Actions -->
      @if (isSelectMode()) {
        <div class="selection-actions">
          <button class="select-all-btn" (click)="toggleSelectAll()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (isAllSelected()) {
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              } @else {
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <polyline points="9 11 12 14 22 4"/>
              }
            </svg>
            {{ isAllSelected() ? 'Desmarcar Todas' : 'Selecionar Todas' }}
          </button>
          @if (selectedCount() > 0) {
            <span class="selection-count">{{ selectedCount() }} selecionada(s)</span>
            <button class="delete-btn" (click)="deleteSelected()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Apagar
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .conversas-page {
      padding: 32px;
      background: #faf9f5;
      min-height: 100vh;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    h1 {
      color: #1a1a1a;
      font-size: 32px;
      font-weight: 500;
      margin: 0;
      font-family: Georgia, serif;
    }

    .new-chat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #1a1a1a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .new-chat-btn:hover {
      background: #333;
    }

    /* Search */
    .search-container {
      position: relative;
      margin-bottom: 16px;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #9a9a9a;
    }

    .search-input {
      width: 100%;
      padding: 14px 16px 14px 48px;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      font-size: 15px;
      color: #1a1a1a;
      background: #fff;
      transition: border-color 0.2s ease;
    }
    .search-input:focus {
      outline: none;
      border-color: #1a1a1a;
    }
    .search-input::placeholder {
      color: #9a9a9a;
    }

    /* Counter Row */
    .counter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding: 0 4px;
    }

    .counter-text {
      font-size: 14px;
      color: #6b6b6b;
    }

    .select-btn {
      background: none;
      border: none;
      color: #1a1a1a;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }
    .select-btn:hover {
      color: #da7756;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      gap: 16px;
      color: #6b6b6b;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e4df;
      border-top-color: #da7756;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Conversations List */
    .conversas-list {
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      overflow: visible;
    }

    .conversa-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e4df;
      transition: background 0.15s ease;
      position: relative;
    }
    .conversa-item:first-child {
      border-radius: 12px 12px 0 0;
    }
    .conversa-item:last-child {
      border-bottom: none;
      border-radius: 0 0 12px 12px;
    }
    .conversa-item:only-child {
      border-radius: 12px;
    }
    .conversa-item:hover {
      background: #faf9f5;
    }
    .conversa-item.selected {
      background: #fff7ed;
    }

    /* Checkbox */
    .checkbox-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    }
    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #d5d4cf;
      border-radius: 4px;
      background: #fff;
      transition: all 0.15s ease;
    }
    .checkbox-container input:checked ~ .checkmark {
      background: #da7756;
      border-color: #da7756;
    }
    .checkbox-container input:checked ~ .checkmark::after {
      content: '';
      position: absolute;
      left: 7px;
      top: 3px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    /* Conversation Content */
    .conversa-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      min-width: 0;
    }

    .conversa-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .conversa-project {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .conversa-titulo {
      font-size: 13px;
      color: #6b6b6b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge-atual {
      font-size: 11px;
      padding: 2px 8px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #1a1a1a;
      border-radius: 4px;
      font-weight: 600;
    }

    .badge-leitura {
      font-size: 11px;
      padding: 2px 8px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-weight: 500;
    }

    .conversa-model {
      font-size: 11px;
      padding: 2px 8px;
      background: #f5f4ef;
      color: #6b6b6b;
      border-radius: 4px;
      text-transform: capitalize;
    }

    .conversa-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .conversa-messages {
      font-size: 13px;
      color: #6b6b6b;
    }

    .conversa-time {
      font-size: 13px;
      color: #9a9a9a;
    }

    /* Menu Container */
    .menu-container {
      position: relative;
    }

    /* Menu Button */
    .menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #9a9a9a;
      opacity: 0;
      transition: all 0.15s ease;
    }
    .conversa-item:hover .menu-btn,
    .menu-container:has(.menu-dropdown) .menu-btn {
      opacity: 1;
    }
    .menu-btn:hover {
      background: #e8e7e2;
      color: #1a1a1a;
    }

    /* Menu Dropdown */
    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 160px;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: #1a1a1a;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s ease;
      text-align: left;
    }
    .menu-item:hover {
      background: #f5f4ef;
    }
    .menu-item svg {
      color: #6b6b6b;
    }
    .menu-item.delete {
      color: #dc2626;
    }
    .menu-item.delete svg {
      color: #dc2626;
    }
    .menu-item.delete:hover {
      background: #fef2f2;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 64px 24px;
    }

    .empty-icon {
      color: #d4d4d4;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0 0 8px;
    }

    .empty-state span {
      font-size: 14px;
      color: #9a9a9a;
    }

    /* Selection Actions */
    .selection-actions {
      position: fixed;
      bottom: 24px;
      left: calc(240px + 50%);  /* 240px = sidebar width */
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 20px;
      background: #1a1a1a;
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      z-index: 100;
    }
    @media (max-width: 768px) {
      .selection-actions {
        left: 50%;  /* Sem sidebar em mobile */
      }
    }
    .selection-actions span {
      font-size: 14px;
    }
    .delete-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .delete-btn:hover {
      background: #b91c1c;
    }
    .select-all-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #374151;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .select-all-btn:hover {
      background: #4b5563;
    }
    .selection-count {
      font-size: 14px;
      margin: 0 8px;
    }
  `]
})
export class ConversasPageComponent implements OnInit {
  private sessionService = inject(SessionService);
  private router = inject(Router);

  searchQuery = '';
  isSelectMode = signal(false);
  activeMenuId = signal<string | null>(null);

  // Signal separado para IDs selecionados (permite seleção múltipla)
  selectedIds = signal<Set<string>>(new Set());

  // Usar computed baseado no sessionService para sincronizar com sidebar
  conversas = computed(() => {
    const sessions = this.sessionService.sessions();
    const sortedSessions = sessions.slice().sort((a, b) => b.updated_at - a.updated_at);
    return sortedSessions.map((session, index) =>
      this.sessionToConversa(session, index === 0)
    );
  });

  // Usar signal do service para loading
  isLoading = computed(() => this.sessionService.isLoading());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Só fecha se clicar fora do menu
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.activeMenuId.set(null);
    }
  }

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    try {
      // Apenas chama list() - o computed() atualiza automaticamente
      await this.sessionService.list();
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error);
    }
  }

  private sessionToConversa(session: Session, isFirst: boolean = false): Conversa {
    const isJsonl = session.file_name?.endsWith('.jsonl') || session.file?.includes('.jsonl') || false;

    // Extrair pasta do projeto do file path
    const filePath = (session.file || '').replace(/\\/g, '/');
    const projectFolder = filePath.split('/').slice(-2, -1)[0] || 'Projeto';

    return {
      id: session.session_id,
      uniqueId: `${session.session_id}-${isJsonl ? 'jsonl' : 'db'}`,
      titulo: session.title || session.file_name || session.session_id.slice(0, 8),
      ultimaMensagem: this.formatDate(session.updated_at),
      messageCount: session.message_count || 0,
      model: session.model || 'claude',
      isJsonl,
      file: session.file_name || session.file || '',
      projectFolder,
      isFirst
    };
  }

  private formatDate(timestamp: number): string {
    // Backend retorna timestamp em milissegundos
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  filteredConversas() {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.conversas();
    return this.conversas().filter(c =>
      c.titulo.toLowerCase().includes(query)
    );
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return newIds;
    });
  }

  selectedCount(): number {
    return this.selectedIds().size;
  }

  isAllSelected(): boolean {
    const all = this.conversas();
    return all.length > 0 && all.every(c => this.selectedIds().has(c.id));
  }

  toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    if (allSelected) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.conversas().map(c => c.id)));
    }
  }

  toggleSelectMode(): void {
    this.isSelectMode.update(v => !v);
    if (!this.isSelectMode()) {
      this.selectedIds.set(new Set());
    }
  }

  openMenu(id: string, event: Event): void {
    event.stopPropagation();
    // Se clicar no mesmo menu, fecha. Se clicar em outro, abre o novo (fechando o anterior)
    const currentId = this.activeMenuId();
    this.activeMenuId.set(currentId === id ? null : id);
  }

  goToAudit(id: string, event: Event): void {
    event.stopPropagation();
    this.activeMenuId.set(null);
    this.router.navigate(['/chat', id, 'audit']);
  }

  async deleteSingle(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    this.activeMenuId.set(null);
    try {
      await this.sessionService.delete(id);
      await this.loadSessions();
    } catch (error) {
      console.error('Erro ao apagar sessao:', id, error);
    }
  }

  async deleteSelected(): Promise<void> {
    const ids = Array.from(this.selectedIds());

    // Usa deleteBulk para evitar múltiplos refreshes
    await this.sessionService.deleteBulk(ids);

    this.selectedIds.set(new Set());
    this.isSelectMode.set(false);
  }
}
