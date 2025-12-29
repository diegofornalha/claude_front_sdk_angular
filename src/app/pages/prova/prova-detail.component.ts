import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

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

interface EvaluationDetail {
  id: string;
  timestamp: string;
  pass_rate: number;
  passed: number;
  failed: number;
  total_questions: number;
  avg_latency_ms: number;
  scores: {
    overall: number;
    groundedness: number;
    keyword_coverage: number;
    source_accuracy: number;
    answer_relevance: number;
    citation_quality: number;
  };
  recommendations: string[];
  results: QuestionResult[];
}

@Component({
  selector: 'app-prova-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-container">
      <header class="detail-header">
        <a routerLink="/prova" class="back-link">&larr; Voltar</a>
        <h1>Avaliacao #{{ evalId() }}</h1>
        @if (data()) {
          <span class="timestamp">{{ formatDate(data()!.timestamp) }}</span>
        }
      </header>

      @if (loading()) {
        <div class="loading">Carregando...</div>
      }

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (data()) {
        <div class="summary-cards">
          <div class="card" [class.passed]="data()!.pass_rate >= 0.6">
            <span class="card-value">{{ (data()!.pass_rate * 100).toFixed(0) }}%</span>
            <span class="card-label">Taxa de Aprovacao</span>
          </div>
          <div class="card">
            <span class="card-value">{{ data()!.passed }}/{{ data()!.total_questions }}</span>
            <span class="card-label">Aprovadas</span>
          </div>
          <div class="card">
            <span class="card-value">{{ (data()!.scores.overall * 100).toFixed(1) }}%</span>
            <span class="card-label">Score Geral</span>
          </div>
          <div class="card">
            <span class="card-value">{{ data()!.avg_latency_ms.toFixed(0) }}ms</span>
            <span class="card-label">Latencia Media</span>
          </div>
        </div>

        <div class="scores-breakdown">
          <h3>Breakdown de Scores</h3>
          <div class="score-bars">
            @for (score of scoreItems(); track score.label) {
              <div class="score-item">
                <span class="score-label">{{ score.label }}</span>
                <div class="score-bar">
                  <div class="score-fill" [style.width.%]="score.value * 100"></div>
                </div>
                <span class="score-value">{{ (score.value * 100).toFixed(0) }}%</span>
              </div>
            }
          </div>
        </div>

        @if (data()!.recommendations.length > 0) {
          <div class="recommendations">
            <h3>Recomendacoes</h3>
            <ul>
              @for (rec of data()!.recommendations; track rec) {
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
                <th>Citacoes</th>
                <th>Latencia</th>
              </tr>
            </thead>
            <tbody>
              @for (result of data()!.results; track result.question_id) {
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
      }
    </div>
  `,
  styles: [
    `
      .detail-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .detail-header {
        margin-bottom: 2rem;
      }

      .back-link {
        color: #6366f1;
        text-decoration: none;
        font-size: 0.875rem;
        display: inline-block;
        margin-bottom: 0.5rem;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      .detail-header h1 {
        font-size: 2rem;
        margin: 0 0 0.25rem;
      }

      .timestamp {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
      }

      .error-banner {
        background: #fef2f2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
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
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .scores-breakdown h3 {
        margin: 0 0 1rem;
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
        margin: 0 0 0.5rem;
      }

      .recommendations ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .recommendations li {
        margin-bottom: 0.25rem;
      }

      .results-table {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow-x: auto;
      }

      .results-table h3 {
        margin: 0 0 1rem;
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
        max-width: 400px;
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
    `,
  ],
})
export class ProvaDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  evalId = signal<string>('');
  data = signal<EvaluationDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  scoreItems = signal<{ label: string; value: number }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.evalId.set(id);
      this.loadEvaluation(id);
    } else {
      this.router.navigate(['/prova']);
    }
  }

  loadEvaluation(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<EvaluationDetail>(`${this.apiUrl}/evaluate/history/${id}`).subscribe({
      next: data => {
        this.data.set(data);
        this.scoreItems.set([
          { label: 'Groundedness', value: data.scores.groundedness },
          { label: 'Keywords', value: data.scores.keyword_coverage },
          { label: 'Sources', value: data.scores.source_accuracy },
          { label: 'Relevance', value: data.scores.answer_relevance },
          { label: 'Citations', value: data.scores.citation_quality },
        ]);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(`Erro ao carregar avaliacao: ${err.error?.detail || err.message}`);
        this.loading.set(false);
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
}
