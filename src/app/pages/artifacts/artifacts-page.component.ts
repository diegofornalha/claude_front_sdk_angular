import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '../../../../projects/claude-front-sdk/src/lib/services/config.service';

interface OutputFile {
  name: string;
  size: number;
  modified: string;
  path?: string;
  session_id?: string;
}

@Component({
  selector: 'app-artifacts-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="artifacts-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Artefatos</h1>
        <button class="new-artifact-btn" (click)="createArtifact()">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo artefato
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'inspiracao'"
          (click)="setTab('inspiracao')"
        >
          Inspiracao
        </button>
        <button class="tab" [class.active]="activeTab() === 'meus'" (click)="setTab('meus')">
          Seus artefatos
        </button>
      </div>

      <!-- Content -->
      <div class="content">
        @if (activeTab() === 'inspiracao') {
          <!-- Inspiracao Tab -->
          <div class="inspiration-grid">
            @for (item of inspirationItems(); track item.title) {
              <div class="inspiration-card">
                <div class="card-preview" [style.background]="item.gradient">
                  <span class="card-icon">{{ item.icon }}</span>
                </div>
                <div class="card-info">
                  <span class="card-title">{{ item.title }}</span>
                  <span class="card-author">{{ item.author }}</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Seus artefatos Tab -->
          @if (isLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Carregando...</span>
            </div>
          } @else if (files().length === 0) {
            <div class="empty-state">
              <div class="empty-illustration">
                <!-- Ilustracao de formas geometricas -->
                <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
                  <!-- Mao -->
                  <path
                    d="M35 95 L35 55 Q35 50 40 50 L45 50 L45 35 Q45 30 50 30 Q55 30 55 35 L55 50 L60 50 L60 25 Q60 20 65 20 Q70 20 70 25 L70 50 L75 50 L75 30 Q75 25 80 25 Q85 25 85 30 L85 60 L85 95"
                    stroke="#9a9a9a"
                    stroke-width="2"
                    fill="none"
                  />
                  <!-- Retangulo/Card -->
                  <rect
                    x="25"
                    y="10"
                    width="30"
                    height="40"
                    rx="3"
                    stroke="#9a9a9a"
                    stroke-width="2"
                    fill="#e5e4df"
                  />
                  <!-- Circulo -->
                  <circle cx="85" y="45" r="15" stroke="#9a9a9a" stroke-width="2" fill="none" />
                  <!-- Triangulo -->
                  <path d="M95 10 L110 35 L80 35 Z" stroke="#9a9a9a" stroke-width="2" fill="none" />
                </svg>
              </div>
              <h2>O que voce vai construir com artefatos?</h2>
              <p>
                Se voce pode sonhar, voce pode construir. Transforme apps, jogos, templates e
                ferramentas de ideias em realidade.
              </p>
              <button class="create-artifact-btn" (click)="createArtifact()">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Criar artefato
              </button>
            </div>
          } @else {
            <ul class="file-list">
              @for (file of files(); track file.name) {
                <li class="file-item">
                  <div class="file-icon">{{ getFileIcon(file.name) }}</div>
                  <div class="file-info">
                    <a [href]="getFileUrl(file)" class="file-name" target="_blank">
                      {{ file.name }}
                    </a>
                    <div class="file-meta">
                      {{ formatSize(file.size) }} - {{ formatDate(file.modified) }}
                    </div>
                  </div>
                  <div class="file-actions">
                    <button class="action-btn" (click)="downloadFile(file)">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button class="action-btn delete" (click)="deleteFile(file)">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              }
            </ul>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .artifacts-page {
        padding: 32px 48px;
        background: #faf9f5;
        min-height: 100vh;
        max-width: 1200px;
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

      .new-artifact-btn {
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
        transition: background 0.15s ease;
      }
      .new-artifact-btn:hover {
        background: #333;
      }

      /* Tabs */
      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 32px;
        border-bottom: 1px solid #e5e4df;
        padding-bottom: 0;
      }

      .tab {
        padding: 12px 20px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        font-size: 15px;
        font-weight: 500;
        color: #6b6b6b;
        cursor: pointer;
        transition: all 0.15s ease;
        margin-bottom: -1px;
      }
      .tab:hover {
        color: #1a1a1a;
      }
      .tab.active {
        color: #1a1a1a;
        border-bottom-color: #da7756;
      }

      /* Content */
      .content {
        min-height: 400px;
      }

      /* Inspiration Grid */
      .inspiration-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
      }

      .inspiration-card {
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .inspiration-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-preview {
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-icon {
        font-size: 48px;
      }

      .card-info {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .card-title {
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .card-author {
        font-size: 12px;
        color: #9a9a9a;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 24px;
        text-align: center;
      }

      .empty-illustration {
        color: #d4d4d4;
        margin-bottom: 32px;
      }

      .empty-state h2 {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 12px;
      }

      .empty-state p {
        font-size: 16px;
        color: #6b6b6b;
        max-width: 480px;
        line-height: 1.6;
        margin: 0 0 32px;
      }

      .create-artifact-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        background: transparent;
        color: #1a1a1a;
        border: 1px solid #d4d4d4;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .create-artifact-btn:hover {
        background: #f5f4ef;
        border-color: #1a1a1a;
      }

      /* Loading State */
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
        to {
          transform: rotate(360deg);
        }
      }

      /* File List */
      .file-list {
        list-style: none;
        padding: 0;
        margin: 0;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 12px;
        overflow: hidden;
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e4df;
        transition: background 0.15s ease;
      }
      .file-item:last-child {
        border-bottom: none;
      }
      .file-item:hover {
        background: #faf9f5;
      }

      .file-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #da7756 0%, #c96a4b 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        font-size: 20px;
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
        font-size: 13px;
        color: #9a9a9a;
        margin-top: 4px;
      }

      .file-actions {
        display: flex;
        gap: 8px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: #f5f4ef;
        border: 1px solid #e5e4df;
        border-radius: 8px;
        cursor: pointer;
        color: #6b6b6b;
        transition: all 0.15s ease;
      }
      .action-btn:hover {
        background: #e8e7e2;
        color: #1a1a1a;
      }
      .action-btn.delete:hover {
        background: #dc2626;
        color: white;
        border-color: #dc2626;
      }
    `,
  ],
})
export class ArtifactsPageComponent implements OnInit {
  private config = inject(ConfigService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeTab = signal<'inspiracao' | 'meus'>('meus');
  files = signal<OutputFile[]>([]);
  isLoading = signal(true);

  inspirationItems = signal([
    {
      title: 'Dashboard Analytics',
      author: 'Claude',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Landing Page',
      author: 'Claude',
      icon: '🚀',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Todo App',
      author: 'Claude',
      icon: '✅',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Quiz Game',
      author: 'Claude',
      icon: '🎮',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: 'Calculadora',
      author: 'Claude',
      icon: '🔢',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: 'Pomodoro Timer',
      author: 'Claude',
      icon: '⏱️',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ]);

  ngOnInit(): void {
    this.loadFiles();
  }

  setTab(tab: 'inspiracao' | 'meus'): void {
    this.activeTab.set(tab);
  }

  createArtifact(): void {
    // Navega para novo chat com modo artefato
    this.router.navigate(['/new'], { queryParams: { mode: 'artifact' } });
  }

  async loadFiles(): Promise<void> {
    this.isLoading.set(true);
    const apiUrl = this.config.getConfig().apiUrl;

    try {
      const response = await fetch(`${apiUrl}/artifacts`);
      const data = await response.json();
      this.files.set(data.files || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      this.files.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
      txt: '📄',
      md: '📝',
      py: '🐍',
      js: '📜',
      ts: '📘',
      json: '📋',
      html: '🌐',
      css: '🎨',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      pdf: '📕',
    };
    return icons[ext] || '📄';
  }

  getFileUrl(file: OutputFile): string {
    const apiUrl = this.config.getConfig().apiUrl;
    const filePath = file.path || file.name;
    return `${apiUrl}/artifacts/file/${filePath}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  downloadFile(file: OutputFile): void {
    const url = this.getFileUrl(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  }

  async deleteFile(file: OutputFile): Promise<void> {
    const apiUrl = this.config.getConfig().apiUrl;
    const filePath = file.path || file.name;

    try {
      const response = await fetch(`${apiUrl}/artifacts/${filePath}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        // Recarregar lista de arquivos
        this.loadFiles();
      } else {
        alert(`Erro ao apagar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao apagar arquivo:', error);
      alert('Erro ao apagar arquivo. Verifique o console para mais detalhes.');
    }
  }
}
