import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../../../projects/claude-front-sdk/src/lib/services/config.service';

interface RagDocument {
  id: number;
  nome: string;
  tipo: string;
  content_length: number;
  metadata: any;
  criado_em: string;
  conteudo?: string;
}

interface DocumentStats {
  total: number;
  backend: number;
  sdk: number;
  angular: number;
  outros: number;
}

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="documents-page">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/config" class="back-link">← Voltar para Config</a>
          <h1>Documentos RAG</h1>
          <p class="subtitle">Base de conhecimento indexada</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-number">{{ stats().total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card backend">
          <span class="stat-number">{{ stats().backend }}</span>
          <span class="stat-label">Backend</span>
        </div>
        <div class="stat-card sdk">
          <span class="stat-number">{{ stats().sdk }}</span>
          <span class="stat-label">SDK</span>
        </div>
        <div class="stat-card angular" [class.highlight]="stats().angular > 0">
          <span class="stat-number">{{ stats().angular }}</span>
          <span class="stat-label">Angular MCP</span>
        </div>
        <div class="stat-card outros">
          <span class="stat-number">{{ stats().outros }}</span>
          <span class="stat-label">Outros</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="tab-btn"
          [class.active]="activeFilter() === 'all'"
          (click)="setFilter('all')">
          Todos ({{ stats().total }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeFilter() === 'backend'"
          (click)="setFilter('backend')">
          Backend ({{ stats().backend }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeFilter() === 'sdk'"
          (click)="setFilter('sdk')">
          SDK ({{ stats().sdk }})
        </button>
        <button
          class="tab-btn angular"
          [class.active]="activeFilter() === 'angular'"
          (click)="setFilter('angular')">
          Angular MCP ({{ stats().angular }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeFilter() === 'outros'"
          (click)="setFilter('outros')">
          Outros ({{ stats().outros }})
        </button>
      </div>

      <!-- Documents List -->
      <div class="documents-list">
        @if (isLoading()) {
          <div class="loading">Carregando documentos...</div>
        } @else if (filteredDocuments().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <p>Nenhum documento encontrado</p>
          </div>
        } @else {
          @for (doc of filteredDocuments(); track doc.id) {
            <div class="document-card" [class.expanded]="expandedId() === doc.id">
              <div class="doc-header" (click)="toggleExpand(doc.id)">
                <div class="doc-info">
                  <span class="doc-type" [attr.data-type]="getDocCategory(doc)">
                    {{ getDocCategory(doc) }}
                  </span>
                  <span class="doc-name">{{ doc.nome }}</span>
                </div>
                <div class="doc-meta">
                  <span class="doc-size">{{ formatBytes(doc.content_length) }}</span>
                  <span class="doc-date">{{ formatDate(doc.criado_em) }}</span>
                  <button class="expand-btn">
                    {{ expandedId() === doc.id ? '▼' : '▶' }}
                  </button>
                </div>
              </div>

              @if (expandedId() === doc.id) {
                <div class="doc-content">
                  @if (loadingContent()) {
                    <div class="content-loading">Carregando conteúdo...</div>
                  } @else if (expandedContent()) {
                    <div class="content-preview">
                      <pre>{{ expandedContent() }}</pre>
                    </div>
                    @if (doc.metadata) {
                      <div class="metadata-section">
                        <h4>Metadata</h4>
                        <pre>{{ formatMetadata(doc.metadata) }}</pre>
                      </div>
                    }
                  }
                  <div class="doc-actions">
                    <button class="delete-btn" (click)="deleteDocument(doc.id, $event)">
                      Excluir documento
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .documents-page {
      padding: 32px;
      background: #faf9f5;
      min-height: 100vh;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .back-link {
      color: #6b6b6b;
      text-decoration: none;
      font-size: 14px;
      display: inline-block;
      margin-bottom: 8px;
    }
    .back-link:hover {
      color: #1a1a1a;
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
      margin: 0;
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      padding: 16px 24px;
      text-align: center;
      min-width: 100px;
      flex: 1;
    }

    .stat-card.highlight {
      border-color: #dd0031;
      background: rgba(221, 0, 49, 0.03);
    }

    .stat-number {
      display: block;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #6b6b6b;
      margin-top: 4px;
    }

    .stat-card.backend .stat-number { color: #3b82f6; }
    .stat-card.sdk .stat-number { color: #8b5cf6; }
    .stat-card.angular .stat-number { color: #dd0031; }
    .stat-card.outros .stat-number { color: #6b6b6b; }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 8px 16px;
      border: 1px solid #e5e4df;
      background: #fff;
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      color: #6b6b6b;
    }
    .tab-btn:hover {
      background: #f5f4ef;
    }
    .tab-btn.active {
      background: #1a1a1a;
      color: #fff;
      border-color: #1a1a1a;
    }
    .tab-btn.angular.active {
      background: #dd0031;
      border-color: #dd0031;
    }

    /* Documents List */
    .documents-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .document-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      overflow: hidden;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .doc-header:hover {
      background: #faf9f5;
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .doc-type {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
      background: #f5f4ef;
      color: #6b6b6b;
      flex-shrink: 0;
    }
    .doc-type[data-type="Backend"] { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .doc-type[data-type="SDK"] { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .doc-type[data-type="Angular"] { background: rgba(221, 0, 49, 0.1); color: #dd0031; }

    .doc-name {
      font-size: 14px;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doc-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 12px;
      color: #9a9a9a;
      flex-shrink: 0;
    }

    .expand-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 10px;
      color: #9a9a9a;
      padding: 4px;
    }

    /* Expanded Content */
    .doc-content {
      border-top: 1px solid #e5e4df;
      padding: 16px;
      background: #faf9f5;
    }

    .content-preview {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .content-preview pre {
      margin: 0;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'SF Mono', Monaco, monospace;
      color: #333;
    }

    .metadata-section {
      margin-top: 12px;
    }

    .metadata-section h4 {
      font-size: 12px;
      font-weight: 600;
      color: #6b6b6b;
      margin: 0 0 8px;
    }

    .metadata-section pre {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 6px;
      padding: 12px;
      margin: 0;
      font-size: 11px;
      font-family: 'SF Mono', Monaco, monospace;
      color: #666;
    }

    .doc-actions {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
    }

    .delete-btn {
      background: #ef4444;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .delete-btn:hover {
      background: #dc2626;
    }

    /* States */
    .loading, .empty-state, .content-loading {
      text-align: center;
      padding: 48px;
      color: #6b6b6b;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class DocumentsPageComponent implements OnInit {
  private configService = inject(ConfigService);

  documents = signal<RagDocument[]>([]);
  isLoading = signal(true);
  activeFilter = signal<'all' | 'backend' | 'sdk' | 'angular' | 'outros'>('all');
  expandedId = signal<number | null>(null);
  expandedContent = signal<string | null>(null);
  loadingContent = signal(false);

  stats = computed<DocumentStats>(() => {
    const docs = this.documents();
    return {
      total: docs.length,
      backend: docs.filter(d => this.getDocCategory(d) === 'Backend').length,
      sdk: docs.filter(d => this.getDocCategory(d) === 'SDK').length,
      angular: docs.filter(d => this.getDocCategory(d) === 'Angular').length,
      outros: docs.filter(d => this.getDocCategory(d) === 'Outros').length,
    };
  });

  filteredDocuments = computed(() => {
    const filter = this.activeFilter();
    const docs = this.documents();

    if (filter === 'all') return docs;

    return docs.filter(doc => {
      const category = this.getDocCategory(doc);
      switch (filter) {
        case 'backend': return category === 'Backend';
        case 'sdk': return category === 'SDK';
        case 'angular': return category === 'Angular';
        case 'outros': return category === 'Outros';
        default: return true;
      }
    });
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/documents?limit=500`);
      const data = await response.json();
      this.documents.set(data.documents || []);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getDocCategory(doc: RagDocument): string {
    const nome = doc.nome.toLowerCase();

    // Angular MCP
    if (nome.includes('angular') || nome.includes('angular-cli-mcp')) {
      return 'Angular';
    }

    // SDK
    if (nome.includes('sdk') || nome.includes('claude-agent-sdk') || nome.includes('claude_agent_sdk')) {
      return 'SDK';
    }

    // Backend
    if (nome.includes('backend') || nome.startsWith('backend -')) {
      return 'Backend';
    }

    return 'Outros';
  }

  setFilter(filter: 'all' | 'backend' | 'sdk' | 'angular' | 'outros'): void {
    this.activeFilter.set(filter);
  }

  async toggleExpand(docId: number): Promise<void> {
    if (this.expandedId() === docId) {
      this.expandedId.set(null);
      this.expandedContent.set(null);
      return;
    }

    this.expandedId.set(docId);
    this.loadingContent.set(true);
    this.expandedContent.set(null);

    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/documents/${docId}`);
      const data = await response.json();
      const content = data.conteudo || data.content || '';
      // Limita preview a 5000 caracteres
      this.expandedContent.set(content.substring(0, 5000) + (content.length > 5000 ? '\n\n... (conteúdo truncado)' : ''));
    } catch (err) {
      this.expandedContent.set('Erro ao carregar conteúdo');
    } finally {
      this.loadingContent.set(false);
    }
  }

  async deleteDocument(docId: number, event: Event): Promise<void> {
    event.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const response = await fetch(`${this.configService.apiUrl}/rag/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.configService.getConfig().apiKey || ''
        }
      });

      if (response.ok) {
        this.documents.update(docs => docs.filter(d => d.id !== docId));
        this.expandedId.set(null);
      } else {
        alert('Erro ao excluir documento');
      }
    } catch (err) {
      alert('Erro ao excluir documento');
    }
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMetadata(metadata: any): string {
    if (!metadata) return '';
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        return metadata;
      }
    }
    return JSON.stringify(metadata, null, 2);
  }
}
