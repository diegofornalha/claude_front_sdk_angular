import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../../../projects/claude-front-sdk/src/lib/services/config.service';

interface RagConfig {
  db_path: string;
  db_exists: boolean;
  db_size_bytes: number;
  db_size_human: string;
  stats: {
    total_documents: number;
    total_embeddings: number;
    total_size_bytes: number;
    status: string;
  };
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
}

@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="config-page">
      <h1>Configuração RAG</h1>
      <p class="subtitle">Gerencie a base de conhecimento</p>

      <!-- Status Card -->
      <div class="config-card">
        <div class="card-header">
          <h2>Status da Base</h2>
          <span class="status-badge" [class.active]="config()?.stats?.total_documents">
            {{ config()?.stats?.total_documents ? 'Ativo' : 'Vazio' }}
          </span>
        </div>
        <div class="card-body">
          @if (isLoading()) {
            <div class="loading">Carregando...</div>
          } @else if (config()) {
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ config()?.stats?.total_documents || 0 }}</span>
                <span class="stat-label">Documentos</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ config()?.stats?.total_embeddings || 0 }}</span>
                <span class="stat-label">Embeddings</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ config()?.db_size_human || '-' }}</span>
                <span class="stat-label">Tamanho DB</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatBytes(config()?.stats?.total_size_bytes || 0) }}</span>
                <span class="stat-label">Conteúdo</span>
              </div>
            </div>

            <div class="config-info">
              <div class="config-row">
                <span class="config-label">Modelo de Embedding</span>
                <span class="config-value">{{ config()?.embedding_model || '-' }}</span>
              </div>
              <div class="config-row">
                <span class="config-label">Chunk Size</span>
                <span class="config-value">{{ config()?.chunk_size || '-' }} palavras</span>
              </div>
              <div class="config-row">
                <span class="config-label">Overlap</span>
                <span class="config-value">{{ config()?.chunk_overlap || '-' }} palavras</span>
              </div>
              <div class="config-row">
                <span class="config-label">Caminho DB</span>
                <span class="config-value">{{ getShortPath(config()?.db_path) }}</span>
              </div>
            </div>
          } @else {
            <div class="empty-state">Sem dados disponíveis</div>
          }
        </div>
      </div>

      <!-- Actions Card -->
      <div class="config-card">
        <div class="card-header">
          <h2>Ações</h2>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <button class="action-btn primary" (click)="reingestBackend()" [disabled]="isReingesting()">
              {{ isReingesting() ? 'Reingestando...' : 'Reingestar Backend' }}
            </button>
            <button class="action-btn primary" (click)="reingestSDK()" [disabled]="isReingesting()">
              {{ isReingesting() ? 'Reingestando...' : 'Reingestar SDK' }}
            </button>
          </div>
          @if (actionMessage()) {
            <div class="action-message" [class.success]="!actionError()" [class.error]="actionError()">
              {{ actionMessage() }}
            </div>
          }
        </div>
      </div>

      <!-- Quick Links -->
      <div class="config-card">
        <div class="card-header">
          <h2>Ferramentas</h2>
        </div>
        <div class="card-body">
          <div class="tools-grid">
            <a routerLink="/search" class="tool-card">
              <span class="tool-icon">🔍</span>
              <span class="tool-name">Busca Semântica</span>
              <span class="tool-desc">Testar queries na base</span>
            </a>
            <a routerLink="/audit" class="tool-card">
              <span class="tool-icon">📊</span>
              <span class="tool-name">Audit</span>
              <span class="tool-desc">Ver tool calls</span>
            </a>
            <a routerLink="/artifacts/my" class="tool-card">
              <span class="tool-icon">📄</span>
              <span class="tool-name">Artifacts</span>
              <span class="tool-desc">Arquivos criados</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-page {
      padding: 32px;
      background: #faf9f5;
      min-height: 100vh;
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      color: #1a1a1a;
      font-size: 32px;
      font-weight: 500;
      margin: 0 0 8px;
      font-family: Georgia, serif;
    }

    .subtitle {
      color: #6b6b6b;
      font-size: 15px;
      margin: 0 0 24px;
    }

    /* Config Card */
    .config-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #faf9f5;
      border-bottom: 1px solid #e5e4df;
    }

    .card-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .card-body {
      padding: 20px;
    }

    /* Status Badge */
    .status-badge {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      background: #f5f4ef;
      color: #9a9a9a;
    }
    .status-badge.active {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
      background: #faf9f5;
      border-radius: 8px;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #6b6b6b;
      margin-top: 4px;
    }

    /* Config Info */
    .config-info {
      border-top: 1px solid #e5e4df;
      padding-top: 16px;
    }

    .config-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }

    .config-label {
      color: #6b6b6b;
      font-size: 14px;
    }

    .config-value {
      color: #1a1a1a;
      font-size: 14px;
      font-family: 'SF Mono', monospace;
    }

    /* Actions */
    .actions-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .action-btn.primary {
      background: #1a1a1a;
      color: white;
    }
    .action-btn.primary:hover:not(:disabled) {
      background: #333;
    }
    .action-btn:disabled {
      background: #9a9a9a;
      cursor: not-allowed;
    }

    .action-message {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }
    .action-message.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    .action-message.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Tools Grid */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .tool-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 16px;
      background: #faf9f5;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.15s;
    }
    .tool-card:hover {
      border-color: #da7756;
      background: #fff;
    }

    .tool-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .tool-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .tool-desc {
      font-size: 12px;
      color: #6b6b6b;
      margin-top: 4px;
    }

    /* States */
    .loading, .empty-state {
      padding: 32px;
      text-align: center;
      color: #6b6b6b;
    }
  `]
})
export class ConfigPageComponent implements OnInit {
  private configService = inject(ConfigService);

  config = signal<RagConfig | null>(null);
  isLoading = signal(true);
  isReingesting = signal(false);
  actionMessage = signal<string | null>(null);
  actionError = signal(false);

  ngOnInit(): void {
    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/config`);
      const data = await response.json();
      this.config.set(data);
    } catch (err) {
      console.error('Erro ao carregar config RAG:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getShortPath(path: string | undefined): string {
    if (!path) return '-';
    const parts = path.split('/');
    return parts.slice(-2).join('/');
  }

  async reingestBackend(): Promise<void> {
    await this.doReingest('/rag/reingest');
  }

  async reingestSDK(): Promise<void> {
    await this.doReingest('/rag/reingest/sdk');
  }

  private async doReingest(endpoint: string): Promise<void> {
    this.isReingesting.set(true);
    this.actionMessage.set(null);
    this.actionError.set(false);

    try {
      const response = await fetch(`${this.configService.apiUrl}${endpoint}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.error) {
        this.actionError.set(true);
        this.actionMessage.set(data.error);
      } else {
        this.actionMessage.set(data.message || 'Reingestão concluída!');
        await this.loadConfig();
      }
    } catch (err: any) {
      this.actionError.set(true);
      this.actionMessage.set(err.message || 'Erro na reingestão');
    } finally {
      this.isReingesting.set(false);
    }
  }
}
