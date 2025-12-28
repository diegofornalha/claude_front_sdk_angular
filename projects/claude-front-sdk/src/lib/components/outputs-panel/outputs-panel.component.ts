import {
  Component,
  signal,
  inject,
  input,
  output,
  OnInit,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutputsService, OutputFile } from '../../services/outputs.service';

@Component({
  selector: 'claude-outputs-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="outputs-panel" [class.open]="isOpen()">
      <!-- Header -->
      <div class="panel-header">
        <h3>Arquivos gerados</h3>
        <button class="close-btn" (click)="close()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="panel-content">
        @if (outputs.isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Carregando arquivos...</span>
          </div>
        } @else if (outputs.files().length === 0) {
          <div class="empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>Nenhum arquivo gerado ainda</p>
            <span class="hint">Arquivos criados pelo Claude aparecerao aqui</span>
          </div>
        } @else {
          <ul class="file-list">
            @for (file of outputs.files(); track file.name) {
              <li class="file-item">
                <div class="file-icon">{{ outputs.getFileIcon(file.name) }}</div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-meta">
                    {{ outputs.formatSize(file.size) }} - {{ outputs.formatDate(file.modified) }}
                  </span>
                </div>
                <div class="file-actions">
                  @if (outputs.isViewable(file.name)) {
                    <a
                      class="action-btn"
                      [href]="getViewerUrl(file)"
                      target="_blank"
                      title="Visualizar"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </a>
                  }
                  <a
                    class="action-btn"
                    [href]="getDownloadUrl(file)"
                    [download]="file.name"
                    title="Baixar"
                  >
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
                  </a>
                  <button class="action-btn delete" (click)="deleteFile(file)" title="Apagar">
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
      </div>

      <!-- Footer com refresh -->
      <div class="panel-footer">
        <button class="refresh-btn" (click)="loadFiles()" [disabled]="outputs.isLoading()">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Atualizar
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .outputs-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #fff;
        border-left: 1px solid #e5e4df;
      }

      /* Header */
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e4df;
      }
      .panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      }
      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        color: #6b6b6b;
      }
      .close-btn:hover {
        background: #f5f4ef;
        color: #1a1a1a;
      }

      /* Content */
      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      /* Loading State */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        gap: 16px;
        color: #6b6b6b;
      }
      .spinner {
        width: 24px;
        height: 24px;
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

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: #9a9a9a;
      }
      .empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
      }
      .empty-state p {
        margin: 0;
        font-size: 14px;
        color: #6b6b6b;
      }
      .empty-state .hint {
        font-size: 12px;
        margin-top: 8px;
      }

      /* File List */
      .file-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .file-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        transition: background 0.15s ease;
      }
      .file-item:hover {
        background: #f5f4ef;
      }

      .file-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #da7756 0%, #c96a4b 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 18px;
        flex-shrink: 0;
      }

      .file-info {
        flex: 1;
        min-width: 0;
      }
      .file-name {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #1a1a1a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .file-meta {
        font-size: 11px;
        color: #9a9a9a;
      }

      .file-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .file-item:hover .file-actions {
        opacity: 1;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 6px;
        cursor: pointer;
        color: #6b6b6b;
        text-decoration: none;
        transition: all 0.15s ease;
      }
      .action-btn:hover {
        background: #f5f4ef;
        color: #1a1a1a;
      }
      .action-btn.delete:hover {
        background: #dc2626;
        border-color: #dc2626;
        color: white;
      }

      /* Footer */
      .panel-footer {
        padding: 12px 16px;
        border-top: 1px solid #e5e4df;
      }
      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid #e5e4df;
        border-radius: 8px;
        font-size: 13px;
        color: #6b6b6b;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .refresh-btn:hover:not(:disabled) {
        background: #f5f4ef;
        color: #1a1a1a;
      }
      .refresh-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class OutputsPanelComponent implements OnInit {
  outputs = inject(OutputsService);

  isOpen = input<boolean>(false);
  sessionId = input<string | undefined>(undefined);

  togglePanel = output<void>();

  constructor() {
    // Recarregar quando sessionId mudar
    effect(() => {
      const sid = this.sessionId();
      if (sid) {
        this.loadFiles();
      }
    });
  }

  ngOnInit(): void {
    this.loadFiles();
  }

  async loadFiles(): Promise<void> {
    await this.outputs.list(this.sessionId());
  }

  close(): void {
    this.togglePanel.emit();
  }

  getViewerUrl(file: OutputFile): string {
    const sid = this.sessionId();
    if (sid) {
      return `http://localhost:3000/backend/artifacts/${sid}/${file.name}`;
    }
    return this.outputs.getFileUrl(file);
  }

  getDownloadUrl(file: OutputFile): string {
    const sid = this.sessionId();
    if (sid) {
      return `http://localhost:3000/backend/artifacts/${sid}/${file.name}`;
    }
    return this.outputs.getFileUrl(file);
  }

  async deleteFile(file: OutputFile): Promise<void> {
    const sid = this.sessionId();
    const path = sid ? `${sid}/${file.name}` : file.name;
    await this.outputs.delete(path);
    await this.loadFiles();
  }
}
