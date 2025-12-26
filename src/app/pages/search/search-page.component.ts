import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../../../projects/claude-front-sdk/src/lib/services/config.service';

interface SearchResult {
  source: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-page">
      <h1>Busca Semântica</h1>
      <p class="subtitle">Busque na base de conhecimento RAG</p>

      <!-- Search Form -->
      <div class="search-card">
        <form class="search-form" (ngSubmit)="doSearch()">
          <div class="search-input-group">
            <label>Consulta</label>
            <input
              type="text"
              [(ngModel)]="query"
              name="query"
              placeholder="Digite sua pergunta ou termos de busca..."
              class="search-input"
              autofocus
            />
          </div>
          <div class="search-input-group top-k-group">
            <label>Top K</label>
            <input
              type="number"
              [(ngModel)]="topK"
              name="topK"
              min="1"
              max="20"
              class="top-k-input"
            />
          </div>
          <button type="submit" class="search-btn" [disabled]="isSearching() || !query.trim()">
            {{ isSearching() ? 'Buscando...' : 'Buscar' }}
          </button>
        </form>

        <!-- Search History -->
        @if (searchHistory().length > 0) {
          <div class="search-history">
            <span class="history-label">Buscas recentes</span>
            <div class="history-chips">
              @for (item of searchHistory(); track item) {
                <button class="history-chip" (click)="searchFromHistory(item)">
                  {{ item }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Results -->
      <div class="results-container">
        @if (isSearching()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Buscando documentos relevantes...</span>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <span class="error-icon">⚠️</span>
            <p>{{ error() }}</p>
          </div>
        } @else if (results().length > 0) {
          <div class="results-header">
            <h2>Resultados</h2>
            <div class="results-meta">
              <span class="results-count">{{ results().length }} documento(s)</span>
              <span class="results-time">em {{ searchTime() }}ms</span>
            </div>
          </div>

          @for (result of results(); track result.source; let i = $index) {
            <div class="result-card">
              <div class="result-header">
                <span class="result-source">#{{ i + 1 }} {{ result.source }}</span>
                <div class="result-score">
                  <div class="score-bar">
                    <div class="score-fill" [style.width.%]="result.score * 100"></div>
                  </div>
                  <span class="score-value">{{ result.score.toFixed(4) }}</span>
                </div>
              </div>
              <div class="result-content">
                <p class="result-text">{{ result.content }}</p>
                @if (result.metadata) {
                  <div class="result-meta">
                    @for (entry of getMetadataEntries(result.metadata); track entry.key) {
                      <span><strong>{{ entry.key }}:</strong> {{ entry.value }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        } @else if (hasSearched()) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>Nenhum resultado encontrado</p>
            <span>Tente termos diferentes ou mais genéricos</span>
          </div>
        } @else {
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <p>Digite uma consulta para buscar</p>
            <span>A busca semântica encontra documentos por significado</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-page {
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

    /* Search Card */
    .search-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .search-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .search-input-group {
      flex: 1;
    }

    .search-input-group label {
      display: block;
      font-size: 11px;
      color: #6b6b6b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      font-size: 15px;
      color: #1a1a1a;
      background: #fff;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      outline: none;
      border-color: #1a1a1a;
    }

    .top-k-group {
      flex: 0 0 80px;
    }

    .top-k-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      font-size: 15px;
      text-align: center;
      color: #1a1a1a;
    }

    .search-btn {
      padding: 12px 24px;
      background: #1a1a1a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .search-btn:hover:not(:disabled) {
      background: #333;
    }
    .search-btn:disabled {
      background: #9a9a9a;
      cursor: not-allowed;
    }

    /* History */
    .search-history {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e4df;
    }

    .history-label {
      font-size: 11px;
      color: #9a9a9a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 10px;
    }

    .history-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .history-chip {
      padding: 6px 12px;
      background: #f5f4ef;
      border: 1px solid #e5e4df;
      border-radius: 16px;
      font-size: 13px;
      color: #6b6b6b;
      cursor: pointer;
      transition: all 0.15s;
    }
    .history-chip:hover {
      background: #fff;
      border-color: #1a1a1a;
      color: #1a1a1a;
    }

    /* Results */
    .results-container {
      min-height: 200px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .results-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .results-meta {
      display: flex;
      gap: 12px;
      font-size: 13px;
    }

    .results-count {
      color: #6b6b6b;
    }

    .results-time {
      color: #9a9a9a;
    }

    /* Result Card */
    .result-card {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .result-card:hover {
      border-color: #da7756;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #faf9f5;
      border-bottom: 1px solid #e5e4df;
    }

    .result-source {
      font-weight: 600;
      font-size: 14px;
      color: #1a1a1a;
    }

    .result-score {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .score-bar {
      width: 60px;
      height: 6px;
      background: #e5e4df;
      border-radius: 3px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #da7756, #e89a7f);
      border-radius: 3px;
    }

    .score-value {
      font-size: 12px;
      font-family: 'SF Mono', monospace;
      color: #6b6b6b;
    }

    .result-content {
      padding: 18px;
    }

    .result-text {
      font-size: 14px;
      color: #3d3d3d;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    .result-meta {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #e5e4df;
      font-size: 12px;
      color: #9a9a9a;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    /* States */
    .loading-state, .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e4df;
      border-top-color: #da7756;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state span {
      color: #6b6b6b;
      font-size: 14px;
    }

    .empty-icon, .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p, .error-state p {
      font-size: 16px;
      color: #3d3d3d;
      margin: 0 0 8px;
    }

    .empty-state span {
      font-size: 14px;
      color: #9a9a9a;
    }

    .error-state {
      color: #dc2626;
    }
  `]
})
export class SearchPageComponent {
  private config = inject(ConfigService);

  query = '';
  topK = 5;

  isSearching = signal(false);
  hasSearched = signal(false);
  results = signal<SearchResult[]>([]);
  error = signal<string | null>(null);
  searchTime = signal(0);
  searchHistory = signal<string[]>([]);

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('rag_search_history');
      if (stored) {
        this.searchHistory.set(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore
    }
  }

  private saveHistory(query: string): void {
    let history = this.searchHistory().filter(q => q !== query);
    history.unshift(query);
    history = history.slice(0, 10);
    this.searchHistory.set(history.slice(0, 5));
    localStorage.setItem('rag_search_history', JSON.stringify(history));
  }

  searchFromHistory(query: string): void {
    this.query = query;
    this.doSearch();
  }

  async doSearch(): Promise<void> {
    const q = this.query.trim();
    if (!q || this.isSearching()) return;

    this.isSearching.set(true);
    this.error.set(null);
    this.results.set([]);

    const startTime = performance.now();

    try {
      const url = `${this.config.apiUrl}/rag/search/test?query=${encodeURIComponent(q)}&top_k=${this.topK}`;
      const response = await fetch(url);
      const data = await response.json();

      this.searchTime.set(Math.round(performance.now() - startTime));
      this.hasSearched.set(true);
      this.saveHistory(q);

      if (data.error) {
        this.error.set(data.error);
        return;
      }

      this.results.set(data.results || []);
    } catch (err: any) {
      this.error.set(err.message || 'Erro ao buscar');
    } finally {
      this.isSearching.set(false);
    }
  }

  getMetadataEntries(metadata: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }
}
