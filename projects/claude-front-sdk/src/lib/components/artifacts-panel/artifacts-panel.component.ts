import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Artifact {
  id: string;
  title: string;
  type: 'code' | 'image' | 'html' | 'markdown' | 'svg' | 'react';
  content: string;
  language?: string;
  createdAt: Date;
}

@Component({
  selector: 'claude-artifacts-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="artifacts-panel" [class.open]="isOpen()">
      <div class="panel-header">
        <h3>Artefatos</h3>
        <button class="close-btn" (click)="togglePanel.emit()" title="Fechar painel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        @if (artifacts().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </div>
            <p>Artefatos aparecerão aqui</p>
            <span class="empty-hint">Código, imagens e outros conteúdos gerados pelo Claude</span>
          </div>
        } @else {
          <div class="artifacts-list">
            @for (artifact of artifacts(); track artifact.id) {
              <div
                class="artifact-item"
                [class.selected]="selectedArtifact()?.id === artifact.id"
                (click)="selectArtifact(artifact)">
                <div class="artifact-icon">
                  @switch (artifact.type) {
                    @case ('code') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                      </svg>
                    }
                    @case ('image') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    }
                    @case ('html') {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    }
                    @default {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                      </svg>
                    }
                  }
                </div>
                <div class="artifact-info">
                  <span class="artifact-title">{{ artifact.title }}</span>
                  <span class="artifact-type">{{ getTypeLabel(artifact.type) }}</span>
                </div>
              </div>
            }
          </div>

          @if (selectedArtifact()) {
            <div class="artifact-preview">
              <div class="preview-header">
                <span class="preview-title">{{ selectedArtifact()!.title }}</span>
                <div class="preview-actions">
                  <button class="action-btn" title="Copiar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                  <button class="action-btn" title="Download">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="preview-content">
                @if (selectedArtifact()!.type === 'code') {
                  <pre><code>{{ selectedArtifact()!.content }}</code></pre>
                } @else {
                  <div class="preview-text">{{ selectedArtifact()!.content }}</div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .artifacts-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      border-left: 1px solid #e5e4df;
    }

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
      color: #3d3d3d;
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
      transition: all 0.15s ease;
    }
    .close-btn:hover {
      background: #f5f4ef;
      color: #3d3d3d;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }
    .empty-icon {
      color: #d5d4cf;
      margin-bottom: 16px;
    }
    .empty-state p {
      margin: 0 0 8px;
      font-size: 16px;
      color: #6b6b6b;
    }
    .empty-hint {
      font-size: 13px;
      color: #9a9a9a;
    }

    /* Artifacts List */
    .artifacts-list {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .artifact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .artifact-item:hover {
      background: #f5f4ef;
    }
    .artifact-item.selected {
      background: #fef3ed;
    }

    .artifact-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f5f4ef;
      border-radius: 6px;
      color: #6b6b6b;
    }
    .artifact-item.selected .artifact-icon {
      background: #da7756;
      color: white;
    }

    .artifact-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }
    .artifact-title {
      font-size: 14px;
      font-weight: 500;
      color: #3d3d3d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .artifact-type {
      font-size: 12px;
      color: #9a9a9a;
    }

    /* Preview */
    .artifact-preview {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-top: 1px solid #e5e4df;
      min-height: 200px;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e4df;
      background: #faf9f5;
    }
    .preview-title {
      font-size: 13px;
      font-weight: 500;
      color: #3d3d3d;
    }
    .preview-actions {
      display: flex;
      gap: 4px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #6b6b6b;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: #e8e7e2;
      color: #3d3d3d;
    }

    .preview-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
    .preview-content pre {
      margin: 0;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    .preview-text {
      font-size: 14px;
      line-height: 1.6;
      color: #3d3d3d;
    }
  `]
})
export class ArtifactsPanelComponent {
  isOpen = input<boolean>(true);
  artifacts = input<Artifact[]>([]);
  togglePanel = output<void>();

  selectedArtifact = signal<Artifact | null>(null);

  selectArtifact(artifact: Artifact): void {
    this.selectedArtifact.set(artifact);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      code: 'Código',
      image: 'Imagem',
      html: 'HTML',
      markdown: 'Markdown',
      svg: 'SVG',
      react: 'React Component'
    };
    return labels[type] || type;
  }
}
