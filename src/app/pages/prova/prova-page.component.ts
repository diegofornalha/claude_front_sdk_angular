import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

        <button class="btn-secondary" (click)="loadConfig()" [disabled]="isRunning()">
          Recarregar Perguntas
        </button>
      </div>

      @if (error()) {
        <div class="error-banner">
          {{ error() }}
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
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
    `,
  ],
})
export class ProvaPageComponent {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  questions = signal<QAPair[]>([]);
  report = signal<EvaluationReport | null>(null);
  isRunning = signal(false);
  currentQuestion = signal(0);
  error = signal<string | null>(null);

  constructor() {
    this.loadConfig();
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

  runEvaluation() {
    this.error.set(null);
    this.report.set(null);
    this.isRunning.set(true);
    this.currentQuestion.set(0);

    // Simular progresso
    const progressInterval = setInterval(() => {
      const current = this.currentQuestion();
      if (current < 10) {
        this.currentQuestion.set(current + 1);
      }
    }, 3000);

    this.http
      .post<EvaluationReport>(
        `${this.apiUrl}/evaluate/run`,
        {},
        {
          headers: { 'X-API-Key': this.getApiKey() },
        }
      )
      .subscribe({
        next: data => {
          clearInterval(progressInterval);
          this.currentQuestion.set(10);
          this.report.set(data);
          this.isRunning.set(false);
        },
        error: err => {
          clearInterval(progressInterval);
          this.error.set(`Erro na avaliação: ${err.error?.detail || err.message}`);
          this.isRunning.set(false);
        },
      });
  }

  private getApiKey(): string {
    // Tentar pegar do localStorage ou usar vazio
    return localStorage.getItem('rag_api_key') || '';
  }
}
