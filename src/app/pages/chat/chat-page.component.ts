import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatComponent } from '../../../../projects/claude-front-sdk/src/lib/components/chat/chat.component';
import { ArtifactsPanelComponent } from '../../../../projects/claude-front-sdk/src/lib/components/artifacts-panel/artifacts-panel.component';
import { ChatService } from '../../../../projects/claude-front-sdk/src/lib/services/chat.service';

interface ArtifactCategory {
  id: string;
  title: string;
  iconSvg: string;
  prompt: string;
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatComponent, ArtifactsPanelComponent],
  template: `
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

    <div class="chat-page" [class.panel-open]="isArtifactsPanelOpen()" [class.anonymous]="isAnonymousMode()">
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

      <!-- Botão flutuante: Artefatos (se houver) ou Modo Anônimo -->
      @if (!isArtifactsPanelOpen()) {
        @if (hasArtifacts()) {
          <!-- Botão Artefatos -->
          <button class="floating-btn artifacts-btn" (click)="toggleArtifactsPanel()" title="Abrir Artefatos">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            @if (artifactsCount() > 0) {
              <span class="badge">{{ artifactsCount() }}</span>
            }
          </button>
        } @else if (!isAnonymousMode()) {
          <!-- Botão Modo Anônimo -->
          <button class="floating-btn anonymous-btn" (click)="enterAnonymousMode()" title="Ativar chat anônimo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a9 9 0 0 0-9 9c0 3.03 1.53 5.82 4 7.47V22l3.5-2 3.5 2v-3.53c2.47-1.65 4-4.44 4-7.47a9 9 0 0 0-9-9zm-3 10c-.83 0-1.5-.67-1.5-1.5S8.17 9 9 9s1.5.67 1.5 1.5S9.83 12 9 12zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 9 15 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
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

    .artifacts-section {
      overflow: hidden;
      display: none;
    }
    .artifacts-section.open {
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
    .artifacts-btn {
      background: #fff;
      border: 1px solid #e5e4df;
      color: #6b6b6b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .artifacts-btn:hover {
      background: #f5f4ef;
      border-color: #d5d4cf;
      color: #3d3d3d;
    }
    .artifacts-btn .badge {
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
export class ChatPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat = inject(ChatService);

  isArtifactsPanelOpen = signal(false);
  isAnonymousMode = signal(false);
  isArtifactMode = signal(false);
  hasArtifacts = signal(false);
  artifactsCount = signal(0);
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

    // Verificar sessionId na rota e carregar mensagens
    this.route.params.subscribe(async params => {
      const sessionId = params['sessionId'];
      if (sessionId) {
        await this.chat.loadSession(sessionId);
        this.isNewChat = false;
      }
    });

    // Verificar query parameters
    this.route.queryParams.subscribe(params => {
      this.isAnonymousMode.set(params['incognito'] !== undefined);
      this.isArtifactMode.set(params['mode'] === 'artifact');
    });
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
}
