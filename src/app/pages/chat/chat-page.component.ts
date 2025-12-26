import { Component, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ChatComponent } from '../../../../projects/claude-front-sdk/src/lib/components/chat/chat.component';
import { ArtifactsPanelComponent } from '../../../../projects/claude-front-sdk/src/lib/components/artifacts-panel/artifacts-panel.component';
import { OutputsPanelComponent } from '../../../../projects/claude-front-sdk/src/lib/components/outputs-panel/outputs-panel.component';
import { ChatService } from '../../../../projects/claude-front-sdk/src/lib/services/chat.service';
import { OutputsService, OutputFile } from '../../../../projects/claude-front-sdk/src/lib/services/outputs.service';
import { ConfigService } from '../../../../projects/claude-front-sdk/src/lib/services/config.service';

interface ArtifactCategory {
  id: string;
  title: string;
  iconSvg: string;
  prompt: string;
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatComponent, ArtifactsPanelComponent, OutputsPanelComponent],
  template: `
    <!-- Modo Fullpage Outputs/Artifacts -->
    @if (isOutputsFullPage()) {
      <div class="outputs-fullpage">
        <header class="outputs-header">
          <a class="back-link" (click)="exitOutputsFullPage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Voltar ao Chat
          </a>
          <h1>
            Outputs
            <span class="session-badge" [class.warning]="!currentSessionId()">
              {{ currentSessionId() ? (currentSessionId() | slice:0:8) + '...' : 'Sem sessao' }}
            </span>
          </h1>
          <button class="refresh-btn" (click)="refreshOutputs()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Atualizar
          </button>
        </header>

        <div class="outputs-content">
          <div class="outputs-card">
            <div class="card-header">
              <h2>Arquivos da Sessao</h2>
              <span class="files-count">{{ outputs.files().length }} arquivo{{ outputs.files().length !== 1 ? 's' : '' }}</span>
            </div>
            <ul class="file-list">
              @if (outputs.isLoading()) {
                <li class="loading-state">
                  <div class="spinner"></div>
                  Carregando...
                </li>
              } @else if (outputs.files().length === 0) {
                <li class="empty-state">
                  <span class="empty-icon">📁</span>
                  Nenhum arquivo ainda
                </li>
              } @else {
                @for (file of outputs.files(); track file.name) {
                  <li class="file-item">
                    <div class="file-icon">{{ outputs.getFileIcon(file.name) }}</div>
                    <div class="file-info">
                      <a class="file-name" [href]="getOutputFileUrl(file)" target="_blank">{{ file.name }}</a>
                      <div class="file-meta">{{ outputs.formatSize(file.size) }} - {{ outputs.formatDate(file.modified) }}</div>
                    </div>
                    <div class="file-actions">
                      <button class="action-btn" (click)="downloadFile(file)">Download</button>
                      <button class="action-btn delete" (click)="deleteOutputFile(file)">Apagar</button>
                    </div>
                  </li>
                }
              }
            </ul>
          </div>
        </div>
      </div>
    } @else {
      <!-- Header modo anônimo -->
      @if (isAnonymousMode()) {
        <div class="anonymous-header">
          <div class="anonymous-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a9 9 0 0 0-9 9c0 3.03 1.53 5.82 4 7.47V22l3.5-2 3.5 2v-3.53c2.47-1.65 4-4.44 4-7.47a9 9 0 0 0-9-9zm-3 10c-.83 0-1.5-.67-1.5-1.5S8.17 9 9 9s1.5.67 1.5 1.5S9.83 12 9 12zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 9 15 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            <span>Chat anônimo</span>
          </div>
          <button class="close-anonymous-btn" (click)="exitAnonymousMode()" title="Sair do modo anônimo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }

      <div class="chat-page" [class.panel-open]="isArtifactsPanelOpen() || isOutputsPanelOpen()" [class.anonymous]="isAnonymousMode()">
      <div class="chat-section">
        <!-- Artifact Mode: Mostrar cards de categoria -->
        @if (isArtifactMode() && !hasMessages()) {
          <div class="artifact-mode">
            <div class="artifact-header">
              <span class="artifact-title">Sem titulo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <div class="artifact-content">
              <h2>Maos a obra! Escolha uma categoria de artefato ou comece a construir sua ideia do zero.</h2>
              <div class="artifact-categories">
                @for (cat of artifactCategories(); track cat.id) {
                  <button class="category-card" (click)="selectCategory(cat)">
                    <span class="category-title">{{ cat.title }}</span>
                    <div class="category-icon">
                      <svg [innerHTML]="cat.iconSvg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"></svg>
                    </div>
                  </button>
                }
              </div>
            </div>
          </div>
        } @else {
          <claude-chat />
        }
      </div>

      <div class="artifacts-section" [class.open]="isArtifactsPanelOpen()">
        <claude-artifacts-panel
          [isOpen]="isArtifactsPanelOpen()"
          (togglePanel)="toggleArtifactsPanel()"
        />
      </div>

      <!-- Painel de Outputs -->
      <div class="outputs-section" [class.open]="isOutputsPanelOpen()">
        <claude-outputs-panel
          [isOpen]="isOutputsPanelOpen()"
          [sessionId]="currentSessionId()"
          (togglePanel)="toggleOutputsPanel()"
        />
      </div>

      <!-- Botões flutuantes -->
      @if (!isArtifactsPanelOpen() && !isOutputsPanelOpen()) {
        <div class="floating-buttons">
          <!-- Botão Outputs (sempre visível se tiver sessão) -->
          @if (currentSessionId() && hasOutputFiles()) {
            <button class="floating-btn outputs-btn" (click)="toggleOutputsPanel()" title="Ver arquivos gerados">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              @if (outputsCount() > 0) {
                <span class="badge">{{ outputsCount() }}</span>
              }
            </button>
          }

          <!-- Botão Artefatos (se houver) -->
          @if (hasArtifacts()) {
            <button class="floating-btn artifacts-btn" (click)="toggleArtifactsPanel()" title="Abrir Artefatos">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              @if (artifactsCount() > 0) {
                <span class="badge">{{ artifactsCount() }}</span>
              }
            </button>
          }

          <!-- Botão Modo Anônimo (se não tiver artefatos/outputs) -->
          @if (!hasArtifacts() && !hasOutputFiles() && !isAnonymousMode()) {
            <button class="floating-btn anonymous-btn" (click)="enterAnonymousMode()" title="Ativar chat anônimo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a9 9 0 0 0-9 9c0 3.03 1.53 5.82 4 7.47V22l3.5-2 3.5 2v-3.53c2.47-1.65 4-4.44 4-7.47a9 9 0 0 0-9-9zm-3 10c-.83 0-1.5-.67-1.5-1.5S8.17 9 9 9s1.5.67 1.5 1.5S9.83 12 9 12zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 9 15 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>
          }
        </div>
      }
    </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    /* Outputs Fullpage Mode */
    .outputs-fullpage {
      height: 100%;
      background: #faf9f5;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }

    .outputs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e4df;
      background: #fff;
    }

    .outputs-header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b6b6b;
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.15s;
    }
    .back-link:hover {
      color: #da7756;
    }

    .session-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 16px;
      background: #22c55e;
      color: white;
      font-weight: 500;
    }
    .session-badge.warning {
      background: #f59e0b;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #da7756;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .refresh-btn:hover {
      background: #c96a4b;
    }

    .outputs-content {
      flex: 1;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .outputs-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e4df;
      background: #f5f4ef;
    }
    .card-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .files-count {
      font-size: 14px;
      color: #6b6b6b;
    }

    .file-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e4df;
      transition: background 0.15s;
    }
    .file-item:last-child {
      border-bottom: none;
    }
    .file-item:hover {
      background: #f5f4ef;
    }

    .file-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #22c55e 0%, #da7756 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .file-info {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-weight: 600;
      color: #1a1a1a;
      text-decoration: none;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-name:hover {
      color: #da7756;
    }

    .file-meta {
      font-size: 12px;
      color: #9a9a9a;
      margin-top: 4px;
    }

    .file-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: #f5f4ef;
      border: 1px solid #e5e4df;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: #6b6b6b;
      transition: all 0.15s;
    }
    .action-btn:hover {
      background: #e5e4df;
      color: #1a1a1a;
    }
    .action-btn.delete:hover {
      background: #dc2626;
      color: white;
      border-color: #dc2626;
    }

    .loading-state,
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: #6b6b6b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e5e4df;
      border-top-color: #da7756;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .empty-icon {
      font-size: 48px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Anonymous Header */
    .anonymous-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #1a1a1a;
      color: white;
    }

    .anonymous-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    .anonymous-title svg {
      opacity: 0.9;
    }

    .close-anonymous-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: white;
      opacity: 0.7;
      transition: all 0.15s ease;
    }
    .close-anonymous-btn:hover {
      opacity: 1;
      background: rgba(255,255,255,0.1);
    }

    /* Chat Page */
    .chat-page {
      display: grid;
      grid-template-columns: 1fr;
      height: 100%;
      transition: grid-template-columns 0.3s ease;
      position: relative;
      background: #faf9f5;
    }

    .chat-page.anonymous {
      height: calc(100% - 56px);
    }

    .chat-page.panel-open {
      grid-template-columns: 1fr 420px;
    }

    .chat-section {
      overflow: hidden;
      min-width: 0;
    }

    .artifacts-section,
    .outputs-section {
      overflow: hidden;
      display: none;
    }
    .artifacts-section.open,
    .outputs-section.open {
      display: block;
    }

    /* Floating Button Base */
    .floating-btn {
      position: fixed;
      right: 24px;
      bottom: 100px;
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 100;
    }

    /* Botão Artefatos */
    .artifacts-btn,
    .outputs-btn {
      background: #fff;
      border: 1px solid #e5e4df;
      color: #6b6b6b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .artifacts-btn:hover,
    .outputs-btn:hover {
      background: #f5f4ef;
      border-color: #d5d4cf;
      color: #3d3d3d;
    }
    .artifacts-btn .badge,
    .outputs-btn .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #da7756;
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    /* Floating buttons stack */
    .floating-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: fixed;
      right: 24px;
      bottom: 100px;
      z-index: 100;
    }
    .floating-buttons .floating-btn {
      position: relative;
      right: auto;
      bottom: auto;
    }

    /* Botão Modo Anônimo */
    .anonymous-btn {
      background: #1a1a1a;
      border: none;
      color: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    .anonymous-btn:hover {
      background: #2a2a2a;
      transform: scale(1.05);
    }

    /* Ajuste para modo anônimo */
    .chat-page.anonymous .floating-btn {
      bottom: 100px;
    }

    @media (max-width: 1024px) {
      .chat-page.panel-open {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 350px;
      }
    }

    /* Artifact Mode */
    .artifact-mode {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #faf9f5;
    }

    .artifact-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e4df;
    }

    .artifact-title {
      font-size: 16px;
      color: #6b6b6b;
    }

    .artifact-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .artifact-content h2 {
      font-size: 20px;
      font-weight: 500;
      color: #1a1a1a;
      text-align: center;
      margin: 0 0 40px;
      line-height: 1.4;
    }

    .artifact-categories {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      width: 100%;
    }

    @media (max-width: 900px) {
      .artifact-categories {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .artifact-categories {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .category-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      cursor: pointer;
      min-height: 120px;
      text-align: left;
      transition: all 0.15s ease;
    }
    .category-card:hover {
      border-color: #d5d4cf;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .category-title {
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
      line-height: 1.3;
    }

    .category-icon {
      align-self: flex-end;
      color: #9a9a9a;
    }
  `]
})
export class ChatPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat = inject(ChatService);
  outputs = inject(OutputsService);  // public para usar no template
  private config = inject(ConfigService);

  // CORREÇÃO: Subject para cleanup de subscriptions
  private destroy$ = new Subject<void>();

  isArtifactsPanelOpen = signal(false);
  isOutputsPanelOpen = signal(false);
  isOutputsFullPage = signal(false);  // Modo fullpage outputs (?artifact)
  isAnonymousMode = signal(false);
  isArtifactMode = signal(false);
  hasArtifacts = signal(false);
  hasOutputFiles = signal(false);
  artifactsCount = signal(0);
  outputsCount = signal(0);
  currentSessionId = signal<string | undefined>(undefined);
  private isNewChat = false;

  artifactCategories = signal<ArtifactCategory[]>([
    {
      id: 'apps',
      title: 'Aplicativos e sites',
      iconSvg: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>',
      prompt: 'Crie um aplicativo web ou site'
    },
    {
      id: 'docs',
      title: 'Documentos e modelos',
      iconSvg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      prompt: 'Crie um documento ou modelo'
    },
    {
      id: 'games',
      title: 'Jogos',
      iconSvg: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/>',
      prompt: 'Crie um jogo interativo'
    },
    {
      id: 'tools',
      title: 'Ferramentas de produtividade',
      iconSvg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      prompt: 'Crie uma ferramenta de produtividade'
    },
    {
      id: 'creative',
      title: 'Projetos criativos',
      iconSvg: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
      prompt: 'Crie um projeto criativo'
    },
    {
      id: 'quiz',
      title: 'Quiz ou pesquisa',
      iconSvg: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      prompt: 'Crie um quiz ou pesquisa'
    },
    {
      id: 'scratch',
      title: 'Comecar do zero',
      iconSvg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
      prompt: ''
    }
  ]);

  hasMessages = signal(false);

  constructor() {
    // Navegar para /chat/:sessionId quando receber um session_id em /new
    // Mas APENAS se já houver mensagens (após enviar a primeira)
    effect(() => {
      const sessionId = this.chat.currentSessionId();
      const hasMessages = this.chat.messages().length > 0;
      console.log('[ChatPage] Effect:', { sessionId, isNewChat: this.isNewChat, hasMessages, isAnon: this.isAnonymousMode() });
      if (sessionId && this.isNewChat && hasMessages && !this.isAnonymousMode()) {
        console.log('[ChatPage] Navegando para /chat/' + sessionId);
        this.router.navigate(['/chat', sessionId], { replaceUrl: true });
      }
    });

    // Atualizar currentSessionId e carregar outputs quando sessão mudar
    effect(() => {
      const sessionId = this.chat.currentSessionId();
      this.currentSessionId.set(sessionId ?? undefined);
      if (sessionId) {
        this.loadOutputFiles(sessionId);
      }
    });

    // Atualizar contagem de outputs quando files mudar
    effect(() => {
      const files = this.outputs.files();
      this.outputsCount.set(files.length);
      this.hasOutputFiles.set(files.length > 0);
    });
  }

  ngOnInit(): void {
    // Verificar se é novo chat
    this.route.data.subscribe(data => {
      this.isNewChat = data['newChat'] === true;
      if (this.isNewChat) {
        // Limpar sessão anterior ao iniciar novo chat
        this.chat.setSession(null);
        this.chat.clear();
      }
    });

    // UX MELHORADA: Detectar novo chat via router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;

      // Auto-focus no campo de mensagem se solicitado
      if (state['shouldFocus']) {
        setTimeout(() => {
          const messageInput = document.querySelector('textarea[placeholder*="mensagem"]') as HTMLTextAreaElement;
          if (messageInput) {
            messageInput.focus();
            // Placeholder temporário convidativo
            const originalPlaceholder = messageInput.placeholder;
            messageInput.placeholder = 'Comece uma nova conversa...';
            setTimeout(() => {
              messageInput.placeholder = originalPlaceholder;
            }, 3000);
          }
        }, 300);
      }

      // Mostrar feedback de novo chat iniciado
      if (state['isNewChat']) {
        console.log('✨ Novo chat iniciado com transição suave');
      }
    }

    // Verificar sessionId na rota e carregar mensagens
    this.route.params.subscribe(async params => {
      const sessionId = params['sessionId'];
      if (sessionId) {
        // Definir currentSessionId imediatamente da URL
        this.currentSessionId.set(sessionId);
        await this.chat.loadSession(sessionId);
        this.isNewChat = false;
        // Carregar outputs se em modo fullpage
        if (this.isOutputsFullPage()) {
          await this.loadOutputFiles(sessionId);
        }
      }
    });

    // Verificar query parameters
    this.route.queryParams.subscribe(params => {
      this.isAnonymousMode.set(params['incognito'] !== undefined);
      this.isArtifactMode.set(params['mode'] === 'artifact');
      // Verificar se é modo fullpage outputs (?artifact)
      this.isOutputsFullPage.set(params['artifact'] !== undefined);
      // Carregar outputs se em modo fullpage
      if (params['artifact'] !== undefined && this.currentSessionId()) {
        this.loadOutputFiles(this.currentSessionId()!);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup: emitir sinal de destruição para cancelar todas as subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    console.log('[ChatPage] Componente destruído - subscriptions limpas');
  }

  selectCategory(category: ArtifactCategory): void {
    this.isArtifactMode.set(false);
    this.hasMessages.set(true);

    if (category.prompt) {
      // Define o input e envia
      this.chat.input.set(category.prompt);
      this.chat.send();
    }
    // Remove query param mode
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  toggleArtifactsPanel(): void {
    this.isArtifactsPanelOpen.update(open => !open);
  }

  enterAnonymousMode(): void {
    this.router.navigate(['/new'], { queryParams: { incognito: true } });
  }

  exitAnonymousMode(): void {
    this.router.navigate(['/new']);
  }

  addArtifact(): void {
    this.artifactsCount.update(c => c + 1);
    this.hasArtifacts.set(true);
  }

  toggleOutputsPanel(): void {
    this.isOutputsPanelOpen.update(open => !open);
    // Fechar painel de artefatos se abrir outputs
    if (this.isOutputsPanelOpen()) {
      this.isArtifactsPanelOpen.set(false);
    }
  }

  async loadOutputFiles(sessionId: string): Promise<void> {
    await this.outputs.list(sessionId);
  }

  // Métodos para modo fullpage outputs
  exitOutputsFullPage(): void {
    const sessionId = this.currentSessionId();
    if (sessionId) {
      this.router.navigate(['/chat', sessionId]);
    } else {
      this.router.navigate(['/new']);
    }
  }

  async refreshOutputs(): Promise<void> {
    const sessionId = this.currentSessionId();
    if (sessionId) {
      await this.outputs.list(sessionId);
    }
  }

  getOutputFileUrl(file: OutputFile): string {
    const sessionId = this.currentSessionId();
    if (sessionId) {
      return `${this.config.apiUrl}/outputs/${sessionId}/${file.name}`;
    }
    return this.outputs.getFileUrl(file);
  }

  downloadFile(file: OutputFile): void {
    const url = this.getOutputFileUrl(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  }

  async deleteOutputFile(file: OutputFile): Promise<void> {
    const sessionId = this.currentSessionId();
    const path = sessionId ? `${sessionId}/${file.name}` : file.name;
    await this.outputs.delete(path);
    await this.refreshOutputs();
  }
}
