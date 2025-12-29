import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface QAPair {
  id: number;
  question: string;
  expected_answer: string;
  expected_sources: string;
  evidence_keywords: string[];
}

interface QuestionResult {
  question_id: number;
  question: string;
  scores: {
    overall: number;
    groundedness: number;
    keyword_coverage: number;
    source_accuracy: number;
    answer_relevance: number;
    citation_quality: number;
  };
  passed: boolean;
  citations_count: number;
  latency_ms: number;
  answer?: string;
}

interface EvaluationReport {
  id?: string;
  timestamp: string;
  summary: {
    total_questions: number;
    passed: number;
    failed: number;
    pass_rate: number;
  };
  scores: {
    overall: number;
    groundedness: number;
    keyword_coverage: number;
    source_accuracy: number;
    answer_relevance: number;
    citation_quality: number;
  };
  latency: {
    total_ms: number;
    avg_ms: number;
  };
  recommendations: string[];
  results: QuestionResult[];
}

interface EvaluationHistoryItem {
  id: string;
  timestamp: string;
  pass_rate: number;
  passed: number;
  failed: number;
  total_questions: number;
  avg_latency_ms: number;
}

interface LiveResult {
  question: number;
  passed: boolean;
  score: number;
  latency_ms: number;
  citations: number;
  status: 'pending' | 'evaluating' | 'done';
}

@Component({
  selector: 'app-prova-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="prova-container">
      <header class="prova-header">
        <h1>Prova Atlantyx - RAG Enterprise</h1>
        <p>Avaliação automática das 10 perguntas do desafio</p>
      </header>

      <div class="actions">
        <button class="btn-primary" (click)="runEvaluation()" [disabled]="isRunning()">
          @if (isRunning()) {
            <span class="spinner"></span>
            Executando... ({{ currentQuestion() }}/10)
          } @else {
            Executar Avaliação
          }
        </button>

        @if (isRunning()) {
          <button class="btn-stop" (click)="stopEvaluation()">Parar</button>
        }

        <button class="btn-secondary" (click)="loadConfig()" [disabled]="isRunning()">
          Recarregar Perguntas
        </button>

        <button class="btn-history" (click)="toggleHistory()" [disabled]="isRunning()">
          Resultados ({{ historyCount() }})
        </button>
      </div>

      @if (showHistory()) {
        <div class="history-section">
          <div class="history-header">
            <h2>Histórico de Avaliações</h2>
            <button class="btn-close" (click)="toggleHistory()">✕</button>
          </div>

          @if (historyItems().length === 0) {
            <p class="no-history">Nenhuma avaliação realizada ainda.</p>
          } @else {
            <div class="history-list">
              @for (item of historyItems(); track item.id) {
                <div class="history-item" [class.selected]="selectedHistoryId() === item.id">
                  <div class="history-item-main" (click)="loadHistoryItem(item.id)">
                    <span class="history-id">#{{ item.id }}</span>
                    <span class="history-date">{{ formatDate(item.timestamp) }}</span>
                  </div>
                  <div class="history-item-stats">
                    <span class="history-rate" [class.good]="item.pass_rate >= 0.6">
                      {{ (item.pass_rate * 100).toFixed(0) }}%
                    </span>
                    <span class="history-count">{{ item.passed }}/{{ item.total_questions }}</span>
                    <span class="history-latency">{{ item.avg_latency_ms.toFixed(0) }}ms</span>
                    <button
                      class="btn-delete"
                      (click)="deleteHistoryItem(item.id, $event)"
                      title="Deletar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="error-banner">
          {{ error() }}
        </div>
      }

      @if (isRunning() && liveResults().length > 0) {
        <div class="live-progress">
          <h2>Progresso em Tempo Real</h2>
          <div class="live-grid">
            @for (result of liveResults(); track result.question) {
              <div
                class="live-item"
                [class.pending]="result.status === 'pending'"
                [class.evaluating]="result.status === 'evaluating'"
                [class.passed]="result.status === 'done' && result.passed"
                [class.failed]="result.status === 'done' && !result.passed"
              >
                <div class="live-question">Q{{ result.question }}</div>
                <div class="live-status">
                  @if (result.status === 'pending') {
                    <span class="status-icon">⏳</span>
                  } @else if (result.status === 'evaluating') {
                    <span class="status-icon spinning">🔄</span>
                  } @else if (result.passed) {
                    <span class="status-icon">✅</span>
                  } @else {
                    <span class="status-icon">❌</span>
                  }
                </div>
                @if (result.status === 'done') {
                  <div class="live-score">{{ result.score }}%</div>
                  <div class="live-latency">{{ (result.latency_ms / 1000).toFixed(1) }}s</div>
                }
              </div>
            }
          </div>
          <div class="live-summary">
            <span>{{ currentQuestion() }}/{{ totalQuestions() }} questões avaliadas</span>
            @if (currentQuestion() > 0) {
              <span class="live-passed">✅ {{ passedCount() }}</span>
              <span class="live-failed">❌ {{ failedCount() }}</span>
            }
          </div>
        </div>
      }

      @if (report()) {
        <div class="report-section">
          <h2>Resultado da Avaliação</h2>

          <div class="summary-cards">
            <div class="card" [class.passed]="report()!.summary.pass_rate >= 0.6">
              <span class="card-value">{{ (report()!.summary.pass_rate * 100).toFixed(0) }}%</span>
              <span class="card-label">Taxa de Aprovação</span>
            </div>
            <div class="card">
              <span class="card-value">
                {{ report()!.summary.passed }}/{{ report()!.summary.total_questions }}
              </span>
              <span class="card-label">Aprovadas</span>
            </div>
            <div class="card">
              <span class="card-value">{{ report()!.scores.overall.toFixed(1) }}%</span>
              <span class="card-label">Score Geral</span>
            </div>
            <div class="card">
              <span class="card-value">{{ report()!.latency.avg_ms.toFixed(0) }}ms</span>
              <span class="card-label">Latência Média</span>
            </div>
          </div>

          <div class="scores-breakdown">
            <h3>Breakdown de Scores</h3>
            <div class="score-bars">
              <div class="score-item">
                <span class="score-label">Groundedness</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="report()!.scores.groundedness * 100"
                  ></div>
                </div>
                <span class="score-value">
                  {{ (report()!.scores.groundedness * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="score-item">
                <span class="score-label">Keywords</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="report()!.scores.keyword_coverage * 100"
                  ></div>
                </div>
                <span class="score-value">
                  {{ (report()!.scores.keyword_coverage * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="score-item">
                <span class="score-label">Sources</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="report()!.scores.source_accuracy * 100"
                  ></div>
                </div>
                <span class="score-value">
                  {{ (report()!.scores.source_accuracy * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="score-item">
                <span class="score-label">Relevance</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="report()!.scores.answer_relevance * 100"
                  ></div>
                </div>
                <span class="score-value">
                  {{ (report()!.scores.answer_relevance * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="score-item">
                <span class="score-label">Citations</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    [style.width.%]="report()!.scores.citation_quality * 100"
                  ></div>
                </div>
                <span class="score-value">
                  {{ (report()!.scores.citation_quality * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
          </div>

          @if (report()!.recommendations.length > 0) {
            <div class="recommendations">
              <h3>Recomendações</h3>
              <ul>
                @for (rec of report()!.recommendations; track rec) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </div>
          }

          <div class="results-table">
            <h3>Detalhes por Pergunta</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pergunta</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Citações</th>
                  <th>Latência</th>
                </tr>
              </thead>
              <tbody>
                @for (result of report()!.results; track result.question_id) {
                  <tr [class.passed]="result.passed" [class.failed]="!result.passed">
                    <td>{{ result.question_id }}</td>
                    <td class="question-cell">{{ result.question }}</td>
                    <td>{{ (result.scores.overall * 100).toFixed(0) }}%</td>
                    <td>
                      @if (result.passed) {
                        <span class="status-badge passed">PASSOU</span>
                      } @else {
                        <span class="status-badge failed">FALHOU</span>
                      }
                    </td>
                    <td>{{ result.citations_count }}</td>
                    <td>{{ result.latency_ms.toFixed(0) }}ms</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (questions().length > 0 && !report()) {
        <div class="questions-preview">
          <h2>Perguntas Carregadas ({{ questions().length }})</h2>
          <div class="questions-list">
            @for (q of questions(); track q.id) {
              <div class="question-item">
                <span class="question-id">Q{{ q.id }}</span>
                <span class="question-text">{{ q.question }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .prova-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .prova-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .prova-header h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .prova-header p {
        color: #666;
      }

      .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
      }

      .btn-primary,
      .btn-secondary {
        padding: 1rem 2rem;
        font-size: 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary {
        background: #6366f1;
        color: white;
        border: none;
      }

      .btn-primary:hover:not(:disabled) {
        background: #4f46e5;
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #f3f4f6;
      }

      .btn-stop {
        background: #dc2626;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-stop:hover {
        background: #b91c1c;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #fff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-banner {
        background: #fef2f2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .report-section {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .card {
        background: #f3f4f6;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
      }

      .card.passed {
        background: #dcfce7;
      }

      .card-value {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #111;
      }

      .card-label {
        display: block;
        font-size: 0.875rem;
        color: #666;
        margin-top: 0.25rem;
      }

      .scores-breakdown {
        margin-bottom: 2rem;
      }

      .score-bars {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .score-item {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .score-label {
        width: 100px;
        font-size: 0.875rem;
        color: #666;
      }

      .score-bar {
        flex: 1;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      .score-fill {
        height: 100%;
        background: #6366f1;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .score-value {
        width: 50px;
        text-align: right;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .recommendations {
        background: #fef3c7;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
      }

      .recommendations h3 {
        margin-bottom: 0.5rem;
      }

      .recommendations ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .recommendations li {
        margin-bottom: 0.25rem;
      }

      .results-table {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      th,
      td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }

      th {
        background: #f9fafb;
        font-weight: 600;
      }

      .question-cell {
        max-width: 500px;
        white-space: normal;
        word-wrap: break-word;
      }

      tr.passed {
        background: #f0fdf4;
      }

      tr.failed {
        background: #fef2f2;
      }

      .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-badge.passed {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge.failed {
        background: #fecaca;
        color: #dc2626;
      }

      .questions-preview {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .questions-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .question-item {
        display: flex;
        gap: 1rem;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 6px;
      }

      .question-id {
        font-weight: 600;
        color: #6366f1;
      }

      .question-text {
        color: #374151;
      }

      .btn-history {
        padding: 1rem 2rem;
        font-size: 1rem;
        border-radius: 8px;
        cursor: pointer;
        background: #10b981;
        color: white;
        border: none;
      }

      .btn-history:hover:not(:disabled) {
        background: #059669;
      }

      .btn-history:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .history-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .history-header h2 {
        margin: 0;
        font-size: 1.25rem;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem 0.5rem;
      }

      .btn-close:hover {
        color: #111;
      }

      .no-history {
        color: #6b7280;
        text-align: center;
        padding: 2rem;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: #f9fafb;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .history-item:hover {
        background: #f3f4f6;
      }

      .history-item.selected {
        background: #e0e7ff;
        border: 1px solid #6366f1;
      }

      .history-item-main {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .history-id {
        font-weight: 600;
        color: #6366f1;
        font-family: monospace;
      }

      .history-date {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .history-item-stats {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .history-rate {
        font-weight: 600;
        color: #dc2626;
        padding: 0.25rem 0.5rem;
        background: #fecaca;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .history-rate.good {
        color: #166534;
        background: #dcfce7;
      }

      .history-count {
        color: #374151;
        font-size: 0.875rem;
      }

      .history-latency {
        color: #6b7280;
        font-size: 0.75rem;
        font-family: monospace;
      }

      .btn-delete {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem;
        opacity: 0.5;
        transition:
          opacity 0.2s,
          transform 0.2s;
      }

      .btn-delete:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      /* Live Progress */
      .live-progress {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
        border: 2px solid #6366f1;
      }

      .live-progress h2 {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        color: #6366f1;
      }

      .live-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .live-item {
        background: #f9fafb;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        transition: all 0.3s ease;
        border: 2px solid transparent;
      }

      .live-item.pending {
        opacity: 0.5;
      }

      .live-item.evaluating {
        border-color: #f59e0b;
        background: #fef3c7;
        animation: pulse 1.5s infinite;
      }

      .live-item.passed {
        border-color: #10b981;
        background: #d1fae5;
      }

      .live-item.failed {
        border-color: #ef4444;
        background: #fee2e2;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .live-question {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 0.25rem;
      }

      .live-status {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
      }

      .status-icon.spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      .live-score {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }

      .live-latency {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .live-summary {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .live-passed {
        color: #10b981;
        font-weight: 600;
      }

      .live-failed {
        color: #ef4444;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .live-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class ProvaPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  questions = signal<QAPair[]>([]);
  report = signal<EvaluationReport | null>(null);
  isRunning = signal(false);
  currentQuestion = signal(0);
  error = signal<string | null>(null);

  // Abort controller para cancelar avaliacao
  private abortController: AbortController | null = null;

  // Live Progress
  liveResults = signal<LiveResult[]>([]);
  totalQuestions = signal(10);
  passedCount = signal(0);
  failedCount = signal(0);

  // Histórico
  showHistory = signal(false);
  historyItems = signal<EvaluationHistoryItem[]>([]);
  historyCount = signal(0);
  selectedHistoryId = signal<string | null>(null);

  constructor() {
    this.loadConfig();
    this.loadHistoryCount();
  }

  loadConfig() {
    this.error.set(null);
    this.http.get<{ questions: QAPair[] }>(`${this.apiUrl}/evaluate/config`).subscribe({
      next: data => {
        this.questions.set(data.questions || []);
      },
      error: err => {
        this.error.set(`Erro ao carregar perguntas: ${err.message}`);
      },
    });
  }

  async runEvaluation() {
    this.error.set(null);
    this.report.set(null);
    this.isRunning.set(true);
    this.currentQuestion.set(0);
    this.passedCount.set(0);
    this.failedCount.set(0);

    // Inicializar resultados como pending
    const initialResults: LiveResult[] = [];
    for (let i = 1; i <= 10; i++) {
      initialResults.push({
        question: i,
        passed: false,
        score: 0,
        latency_ms: 0,
        citations: 0,
        status: 'pending',
      });
    }
    this.liveResults.set(initialResults);

    // Criar novo AbortController
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.apiUrl}/evaluate/run/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.getApiKey(),
        },
        body: JSON.stringify({}),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              this.handleStreamEvent(data);
            } catch (e) {
              // Ignorar linhas inválidas
            }
          }
        }
      }

      this.loadHistoryCount();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Usuario cancelou - nao mostrar erro
        this.error.set(null);
      } else {
        this.error.set(`Erro na avaliação: ${err.message}`);
      }
    } finally {
      this.isRunning.set(false);
      this.abortController = null;
    }
  }

  stopEvaluation() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private handleStreamEvent(data: any) {
    switch (data.type) {
      case 'start':
        this.totalQuestions.set(data.total);
        break;

      case 'evaluating':
        // Marcar questão como em avaliação
        this.liveResults.update(results =>
          results.map(r =>
            r.question === data.question ? { ...r, status: 'evaluating' as const } : r
          )
        );
        break;

      case 'progress':
        // Atualizar resultado da questão
        this.liveResults.update(results =>
          results.map(r =>
            r.question === data.question
              ? {
                  ...r,
                  status: 'done' as const,
                  passed: data.passed,
                  score: data.score,
                  latency_ms: data.latency_ms,
                  citations: data.citations,
                }
              : r
          )
        );
        this.currentQuestion.set(data.current);
        if (data.passed) {
          this.passedCount.update(c => c + 1);
        } else {
          this.failedCount.update(c => c + 1);
        }
        break;

      case 'complete':
        // Redirecionar para página de detalhes
        this.isRunning.set(false);
        this.router.navigate(['/prova', data.id]);
        break;

      case 'error':
        this.error.set(`Erro: ${data.message}`);
        break;
    }
  }

  private getApiKey(): string {
    // Tentar pegar do localStorage ou usar vazio
    return localStorage.getItem('rag_api_key') || '';
  }

  // ============= Histórico =============

  loadHistoryCount() {
    this.http.get<{ total: number }>(`${this.apiUrl}/evaluate/history`).subscribe({
      next: data => {
        this.historyCount.set(data.total);
      },
      error: () => {
        this.historyCount.set(0);
      },
    });
  }

  toggleHistory() {
    const isShowing = !this.showHistory();
    this.showHistory.set(isShowing);

    if (isShowing) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.http
      .get<{
        total: number;
        evaluations: EvaluationHistoryItem[];
      }>(`${this.apiUrl}/evaluate/history`)
      .subscribe({
        next: data => {
          this.historyItems.set(data.evaluations);
          this.historyCount.set(data.total);
        },
        error: err => {
          this.error.set(`Erro ao carregar histórico: ${err.message}`);
        },
      });
  }

  loadHistoryItem(evalId: string) {
    this.selectedHistoryId.set(evalId);

    this.http.get<any>(`${this.apiUrl}/evaluate/history/${evalId}`).subscribe({
      next: data => {
        // Converter formato do histórico para o formato do report
        const report: EvaluationReport = {
          id: data.id,
          timestamp: data.timestamp,
          summary: {
            total_questions: data.total_questions,
            passed: data.passed,
            failed: data.failed,
            pass_rate: data.pass_rate,
          },
          scores: data.scores,
          latency: {
            total_ms: data.avg_latency_ms * data.total_questions,
            avg_ms: data.avg_latency_ms,
          },
          recommendations: data.recommendations,
          results: data.results,
        };
        this.report.set(report);
        this.showHistory.set(false);
      },
      error: err => {
        this.error.set(`Erro ao carregar avaliação: ${err.message}`);
      },
    });
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  deleteHistoryItem(evalId: string, event: Event) {
    event.stopPropagation(); // Evitar que abra o item ao clicar no delete

    this.http.delete(`${this.apiUrl}/evaluate/history/${evalId}`).subscribe({
      next: () => {
        // Remover da lista local
        this.historyItems.update(items => items.filter(item => item.id !== evalId));
        this.historyCount.update(count => count - 1);

        // Se o item deletado estava selecionado, limpar o report
        if (this.selectedHistoryId() === evalId) {
          this.report.set(null);
          this.selectedHistoryId.set(null);
        }
      },
      error: err => {
        this.error.set(`Erro ao deletar: ${err.error?.detail || err.message}`);
      },
    });
  }
}
