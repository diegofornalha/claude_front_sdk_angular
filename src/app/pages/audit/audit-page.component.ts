import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToolCallsPanelComponent } from '../../../../projects/claude-front-sdk/src/lib/components/toolcalls-panel/toolcalls-panel.component';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule, ToolCallsPanelComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="audit-page">
      @if (sessionId()) {
        <div class="audit-header">
          <button class="back-btn" [routerLink]="['/recents']">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar
          </button>
          <h2>Auditoria</h2>
          <span class="session-badge">{{ sessionId()?.slice(0, 8) }}...</span>
        </div>
      }
      <claude-toolcalls-panel [isOpen]="true" [sessionId]="sessionId()" />
    </div>
  `,
  styles: [
    `
      .audit-page {
        height: 100%;
        background: #fff;
        display: flex;
        flex-direction: column;
      }

      :host {
        display: block;
        height: 100%;
      }

      .audit-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e4df;
        background: #faf9f5;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: transparent;
        border: 1px solid #e5e4df;
        border-radius: 8px;
        color: #6b6b6b;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .back-btn:hover {
        background: #fff;
        border-color: #d5d4cf;
        color: #1a1a1a;
      }

      .audit-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .session-badge {
        font-size: 12px;
        font-family: 'SF Mono', monospace;
        color: #6b6b6b;
        background: #f5f4ef;
        padding: 4px 10px;
        border-radius: 6px;
      }

      ::ng-deep .toolcalls-panel {
        border-left: none !important;
        flex: 1;
      }
    `,
  ],
})
export class AuditPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private paramSub?: Subscription;

  sessionId = signal<string | null>(null);

  ngOnInit(): void {
    // Reagir a mudanças de parâmetro da rota
    this.paramSub = this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      this.sessionId.set(id);
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }
}
