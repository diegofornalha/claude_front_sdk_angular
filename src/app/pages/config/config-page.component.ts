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

interface DocumentStats {
  total: number;
  angular: number;
  backend: number;
  sdk: number;
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

      <!-- Documents Card -->
      <div class="config-card documents-card">
        <div class="card-header">
          <h2>Documentos na Base</h2>
          <a routerLink="/documents" class="view-all-link">Ver todos →</a>
        </div>
        <div class="card-body">
          @if (isLoadingDocs()) {
            <div class="loading">Carregando...</div>
          } @else {
            <div class="docs-stats-row">
              <div class="doc-stat-item">
                <span class="doc-stat-value">{{ docStats().total }}</span>
                <span class="doc-stat-label">Total</span>
              </div>
              <div class="doc-stat-item backend">
                <span class="doc-stat-value">{{ docStats().backend }}</span>
                <span class="doc-stat-label">Backend</span>
              </div>
              <div class="doc-stat-item sdk">
                <span class="doc-stat-value">{{ docStats().sdk }}</span>
                <span class="doc-stat-label">SDK</span>
              </div>
              <div class="doc-stat-item angular" [class.highlight]="docStats().angular > 0">
                <span class="doc-stat-value">{{ docStats().angular }}</span>
                <span class="doc-stat-label">Angular MCP</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Actions Card -->
      <div class="config-card">
        <div class="card-header">
          <h2>Ações de Manutenção</h2>
        </div>
        <div class="card-body">
          <div class="actions-grid">
            <div class="action-item">
              <button class="action-btn primary" (click)="reingestBackend()" [disabled]="isReingesting()">
                {{ isReingesting() && currentAction() === 'backend' ? 'Reingestando...' : 'Reingestar Backend' }}
              </button>
              <span class="action-desc">Atualiza arquivos Python do projeto backend</span>
            </div>
            <div class="action-item">
              <button class="action-btn primary" (click)="reingestSDK()" [disabled]="isReingesting()">
                {{ isReingesting() && currentAction() === 'sdk' ? 'Reingestando...' : 'Reingestar Claude SDK' }}
              </button>
              <span class="action-desc">Adiciona documentação do Claude Agent SDK</span>
            </div>
            <div class="action-item">
              <button class="action-btn angular-btn" (click)="reingestAngular()" [disabled]="isReingesting()">
                {{ isReingesting() && currentAction() === 'angular' ? 'Reingestando...' : 'Reingestar Angular Docs' }}
              </button>
              <span class="action-desc">Busca documentação oficial do Angular via MCP</span>
            </div>
          </div>
          @if (actionOutput()) {
            <div class="action-output" [class.success]="!actionError()" [class.error]="actionError()">
              <pre>{{ actionOutput() }}</pre>
            </div>
          }

          <!-- Reindexação Automática -->
          <div class="watcher-section">
            <div class="watcher-info">
              <div class="watcher-icon">⏰</div>
              <div class="watcher-content">
                <h3>Reindexação Automática</h3>
                <p>Monitora mudanças em arquivos Python e executa reingestão automaticamente (cooldown: 5s).</p>
                <p class="tech-info">Tecnologia: Watchdog (filesystem monitoring)</p>
              </div>
            </div>
            <div class="watcher-controls">
              <label class="toggle-switch">
                <input type="checkbox" [checked]="watcherActive()" (change)="toggleWatcher($event)">
                <span class="toggle-slider"></span>
              </label>
              <span class="watcher-status" [class.active]="watcherActive()">
                {{ watcherActive() ? 'Ativo - monitorando mudanças' : 'Desativado' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="config-card danger-zone">
        <div class="card-header">
          <h2>Zona de Perigo</h2>
        </div>
        <div class="card-body">
          <p class="danger-description">
            Apagar o banco de dados RAG remove permanentemente todos os documentos indexados
            e seus embeddings. Esta ação não pode ser desfeita.
          </p>
          <button class="danger-btn" (click)="deleteDatabase()" [disabled]="isDeleting()">
            {{ isDeleting() ? 'Apagando...' : 'Apagar Banco RAG' }}
          </button>
        </div>
      </div>

      <!-- Roadmap -->
      <div class="config-card">
        <div class="card-header">
          <h2>Roadmap de Funcionalidades</h2>
        </div>
        <div class="card-body roadmap-body">
          <div class="roadmap-list">
            <div class="roadmap-item">
              <div class="roadmap-icon model">🧠</div>
              <div class="roadmap-content">
                <h3>Seleção de Modelo de Embedding</h3>
                <p>Escolher entre BGE Small (rápido), Base (balanceado) ou Large (maior precisão).</p>
                <p class="tech-info">Tecnologia: FastEmbed (Qdrant) - já integrado</p>
              </div>
              <span class="roadmap-badge">Planejado</span>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-icon chunk">📏</div>
              <div class="roadmap-content">
                <h3>Configuração de Chunking</h3>
                <p>Ajustar tamanho dos chunks, overlap e estratégia (fixo, sentença, parágrafo, semântico).</p>
                <p class="tech-info">Tecnologia: Chonkie ou LangChain TextSplitters</p>
              </div>
              <span class="roadmap-badge">Planejado</span>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-icon export">📦</div>
              <div class="roadmap-content">
                <h3>Export/Import de Base</h3>
                <p>Exportar base de conhecimento para backup ou importar de outra instância.</p>
                <p class="tech-info">Tecnologia: SQLite dump/restore nativo + JSON export</p>
              </div>
              <span class="roadmap-badge">Planejado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-page {
      padding: 32px;
      padding-bottom: 64px;
      background: #faf9f5;
      min-height: 100vh;
      max-width: 900px;
      margin: 0 auto;
      overflow-y: auto;
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
      gap: 16px;
      flex-wrap: wrap;
    }

    .action-item {
      flex: 1;
      min-width: 280px;
    }

    .action-btn {
      width: 100%;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: 8px;
    }
    .action-btn.primary {
      background: #1a1a1a;
      color: white;
    }
    .action-btn.primary:hover:not(:disabled) {
      background: #333;
    }
    .action-btn.angular-btn {
      background: #dd0031;
      color: white;
    }
    .action-btn.angular-btn:hover:not(:disabled) {
      background: #b8002a;
    }
    .action-btn:disabled {
      background: #9a9a9a;
      cursor: not-allowed;
    }

    .action-desc {
      display: block;
      font-size: 12px;
      color: #6b6b6b;
    }

    .action-output {
      margin-top: 16px;
      padding: 16px;
      border-radius: 8px;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
    .action-output pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .action-output.success {
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
    }
    .action-output.error {
      background: rgba(239, 68, 68, 0.1);
      color: #b91c1c;
    }

    /* Danger Zone */
    .danger-zone {
      border-color: rgba(239, 68, 68, 0.3);
    }
    .danger-zone .card-header {
      background: rgba(239, 68, 68, 0.05);
      border-bottom-color: rgba(239, 68, 68, 0.3);
    }
    .danger-zone .card-header h2 {
      color: #ef4444;
    }
    .danger-description {
      color: #6b6b6b;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .danger-btn {
      background: #ef4444;
      border: none;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .danger-btn:hover:not(:disabled) {
      background: #dc2626;
    }
    .danger-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    /* States */
    .loading, .empty-state {
      padding: 32px;
      text-align: center;
      color: #6b6b6b;
    }

    /* Documents Card */
    .documents-card .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .view-all-link {
      font-size: 13px;
      color: #3b82f6;
      text-decoration: none;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }
    .docs-stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .doc-stat-item {
      text-align: center;
      padding: 12px;
      background: #faf9f5;
      border-radius: 8px;
    }
    .doc-stat-item.highlight {
      background: rgba(221, 0, 49, 0.05);
      border: 1px solid rgba(221, 0, 49, 0.2);
    }
    .doc-stat-value {
      display: block;
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .doc-stat-item.backend .doc-stat-value { color: #3b82f6; }
    .doc-stat-item.sdk .doc-stat-value { color: #8b5cf6; }
    .doc-stat-item.angular .doc-stat-value { color: #dd0031; }
    .doc-stat-label {
      display: block;
      font-size: 11px;
      color: #6b6b6b;
      margin-top: 4px;
    }

    /* Roadmap */
    .roadmap-body {
      padding: 0 !important;
    }
    .roadmap-list {
      display: flex;
      flex-direction: column;
    }
    .roadmap-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e4df;
      transition: background 0.15s;
    }
    .roadmap-item:last-child {
      border-bottom: none;
    }
    .roadmap-item:hover {
      background: #faf9f5;
    }
    .roadmap-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .roadmap-icon.model { background: rgba(139, 92, 246, 0.1); }
    .roadmap-icon.chunk { background: rgba(245, 158, 11, 0.1); }
    .roadmap-icon.export { background: rgba(236, 72, 153, 0.1); }
    .roadmap-content {
      flex: 1;
    }
    .roadmap-content h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 4px;
    }
    .roadmap-content p {
      font-size: 13px;
      color: #6b6b6b;
      margin: 0;
      line-height: 1.4;
    }
    .roadmap-content .tech-info {
      margin-top: 8px;
      font-style: italic;
      font-size: 12px;
      color: #9a9a9a;
    }
    .roadmap-badge {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Watcher Section */
    .watcher-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e4df;
    }
    .watcher-info {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .watcher-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(6, 182, 212, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .watcher-content h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 4px;
    }
    .watcher-content p {
      font-size: 13px;
      color: #6b6b6b;
      margin: 0;
      line-height: 1.4;
    }
    .watcher-content .tech-info {
      margin-top: 8px;
      font-style: italic;
      font-size: 12px;
      color: #9a9a9a;
    }
    .watcher-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .watcher-status {
      font-size: 14px;
      color: #6b6b6b;
    }
    .watcher-status.active {
      color: #10b981;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    .toggle-switch input:checked + .toggle-slider {
      background-color: #10b981;
    }
    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
  `]
})
export class ConfigPageComponent implements OnInit {
  private configService = inject(ConfigService);

  config = signal<RagConfig | null>(null);
  isLoading = signal(true);
  isReingesting = signal(false);
  isDeleting = signal(false);
  actionOutput = signal<string | null>(null);
  actionError = signal(false);
  currentAction = signal<'backend' | 'sdk' | 'angular' | null>(null);
  watcherActive = signal(false);

  // Document stats
  isLoadingDocs = signal(true);
  docStats = signal<DocumentStats>({ total: 0, angular: 0, backend: 0, sdk: 0 });

  ngOnInit(): void {
    this.loadConfig();
    this.loadWatcherStatus();
    this.loadDocumentStats();
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

  async loadDocumentStats(): Promise<void> {
    this.isLoadingDocs.set(true);
    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/documents?limit=500`);
      const data = await response.json();
      const docs = data.documents || [];

      // Conta documentos por categoria
      let angular = 0, backend = 0, sdk = 0;

      for (const doc of docs) {
        const nome = (doc.nome || '').toLowerCase();
        if (nome.includes('angular') || nome.includes('angular-cli-mcp')) {
          angular++;
        } else if (nome.includes('sdk') || nome.includes('claude-agent-sdk') || nome.includes('claude_agent_sdk')) {
          sdk++;
        } else if (nome.includes('backend') || nome.startsWith('backend -')) {
          backend++;
        }
      }

      this.docStats.set({
        total: docs.length,
        angular,
        backend,
        sdk,
      });
    } catch (err) {
      console.error('Erro ao carregar stats de documentos:', err);
    } finally {
      this.isLoadingDocs.set(false);
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
    this.currentAction.set('backend');
    await this.doReingest('/rag/reingest', '⏳ Analisando arquivos do backend...');
  }

  async reingestSDK(): Promise<void> {
    this.currentAction.set('sdk');
    await this.doReingest('/rag/reingest/sdk', '⏳ Processando Claude Agent SDK...');
  }

  async reingestAngular(): Promise<void> {
    this.currentAction.set('angular');
    this.isReingesting.set(true);
    this.actionOutput.set('⏳ Conectando ao Angular CLI MCP Server...\n\nIsso pode levar alguns segundos na primeira execução.');
    this.actionError.set(false);

    try {
      // Primeiro habilita o adapter
      await fetch(`${this.configService.apiUrl}/mcp/adapters/angular-cli/enable`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.configService.getConfig().apiKey || ''
        }
      });

      // Executa a ingestão síncrona
      const response = await fetch(`${this.configService.apiUrl}/mcp/ingest/angular-cli/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.configService.getConfig().apiKey || ''
        },
        body: JSON.stringify({
          queries: [],  // Usa queries padrão
          include_examples: true,
          include_best_practices: true
        })
      });

      if (!response.ok) {
        this.actionError.set(true);
        if (response.status === 401) {
          this.actionOutput.set('✗ Erro 401: Não autorizado. Verifique a API Key.');
        } else {
          const errorData = await response.json().catch(() => ({}));
          this.actionOutput.set(`✗ Erro ${response.status}: ${errorData.detail || response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        this.actionOutput.set(
          `✓ Reingestão Angular concluída!\n\n` +
          `📊 Resumo:\n` +
          `  • ${data.documents_ingested} documento(s) ingerido(s)\n` +
          `  • Duração: ${data.duration_seconds?.toFixed(2) || '?'}s\n` +
          (data.errors?.length > 0 ? `\n⚠️ Avisos:\n  ${data.errors.join('\n  ')}` : '')
        );

        // Recarrega stats
        await this.loadConfig();
        await this.loadDocumentStats();
      } else {
        this.actionError.set(true);
        this.actionOutput.set('✗ ERRO:\n' + (data.errors?.join('\n') || 'Falha desconhecida'));
      }
    } catch (err: any) {
      this.actionError.set(true);
      this.actionOutput.set('✗ ERRO: ' + (err.message || 'Erro na reingestão Angular'));
    } finally {
      this.isReingesting.set(false);
      this.currentAction.set(null);
    }
  }

  private async doReingest(endpoint: string, progressMessage: string): Promise<void> {
    this.isReingesting.set(true);
    this.actionOutput.set(progressMessage);
    this.actionError.set(false);

    try {
      const response = await fetch(`${this.configService.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.configService.getConfig().apiKey || ''
        }
      });

      if (!response.ok) {
        this.actionError.set(true);
        if (response.status === 401) {
          this.actionOutput.set('✗ Erro 401: Não autorizado. Verifique a API Key.');
        } else {
          this.actionOutput.set(`✗ Erro ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        const output = data.output || '';

        // Check if no changes
        if (output.includes('Nenhum arquivo modificado')) {
          this.actionOutput.set('✓ Base já está atualizada!\n\nNenhum arquivo foi modificado desde a última ingestão.');
        } else {
          // Extract summary
          const processedMatch = output.match(/Arquivos processados:\s*(\d+)/);
          const updatedMatch = output.match(/Novos\/Atualizados:\s*(\d+)/);
          const totalMatch = output.match(/Total documentos:\s*(\d+)/);

          const updated = updatedMatch ? updatedMatch[1] : '?';
          const total = totalMatch ? totalMatch[1] : '?';

          this.actionOutput.set(`✓ Reingestão concluída!\n\n📊 Resumo:\n  • ${updated} arquivo(s) atualizado(s)\n  • ${total} documentos totais na base\n\n${output}`);
        }

        await this.loadConfig();
      } else {
        this.actionError.set(true);
        this.actionOutput.set('✗ ERRO:\n' + (data.error || data.output || 'Falha desconhecida'));
      }
    } catch (err: any) {
      this.actionError.set(true);
      this.actionOutput.set('✗ ERRO: ' + (err.message || 'Erro na reingestão'));
    } finally {
      this.isReingesting.set(false);
      this.currentAction.set(null);
    }
  }

  async deleteDatabase(): Promise<void> {
    if (!confirm('Tem certeza que deseja apagar todo o banco RAG? Esta ação não pode ser desfeita.')) {
      return;
    }

    this.isDeleting.set(true);
    this.actionOutput.set(null);
    this.actionError.set(false);

    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/reset`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.configService.getConfig().apiKey || ''
        }
      });

      if (!response.ok) {
        this.actionError.set(true);
        this.actionOutput.set(`✗ Erro ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        this.actionOutput.set('✓ Banco RAG apagado com sucesso!');
        await this.loadConfig();
      } else {
        this.actionError.set(true);
        this.actionOutput.set('✗ Erro ao apagar banco: ' + (data.detail || 'Falha desconhecida'));
      }
    } catch (err: any) {
      this.actionError.set(true);
      this.actionOutput.set('✗ Erro ao apagar banco: ' + (err.message || 'Erro desconhecido'));
    } finally {
      this.isDeleting.set(false);
    }
  }

  async loadWatcherStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/watcher/status`);
      const data = await response.json();
      this.watcherActive.set(data.active || false);
    } catch (err) {
      console.warn('Não foi possível carregar status do watcher:', err);
    }
  }

  async toggleWatcher(event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    const enabled = checkbox.checked;
    const endpoint = enabled ? '/rag/watcher/start' : '/rag/watcher/stop';

    try {
      const response = await fetch(`${this.configService.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.configService.getConfig().apiKey || ''
        }
      });

      const data = await response.json();

      if (data.success) {
        this.watcherActive.set(enabled);
      } else {
        checkbox.checked = !enabled;
      }
    } catch (err) {
      console.error('Erro ao alternar watcher:', err);
      checkbox.checked = !enabled;
    }
  }
}
