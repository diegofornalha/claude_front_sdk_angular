import { Component, inject, OnInit, OnDestroy, computed, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolCallsService } from '../../services/toolcalls.service';
import { ChatService } from '../../services/chat.service';
import { ConfigService } from '../../services/config.service';

interface DebugEntry {
  timestamp: string;
  timestamp_ms: number;
  level: string;
  message: string;
  tool_name: string | null;
  event_type: string | null;
}

interface DebugData {
  session_id: string;
  found: boolean;
  entries: DebugEntry[];
  count: number;
  summary: {
    total_events: number;
    tool_events: number;
    file_writes: number;
    streams: number;
  };
}

@Component({
  selector: 'claude-toolcalls-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolcalls-panel">
      <div class="panel-header">
        <h3>Bastidores</h3>
        <button class="close-btn" (click)="togglePanel.emit()" title="Fechar painel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats()?.total_calls ?? 0 }}</div>
          <div class="stat-label">Chamadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" [class.error]="(stats()?.errors ?? 0) > 0">
            {{ stats()?.errors ?? 0 }}
          </div>
          <div class="stat-label">Erros</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ (stats()?.avg_duration_ms ?? 0) | number:'1.0-0' }}ms</div>
          <div class="stat-label">Latência</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ toolCount() }}</div>
          <div class="stat-label">Tools</div>
        </div>
      </div>

      <!-- Tools Chart -->
      @if (toolEntries().length > 0) {
        <div class="chart-section">
          <div class="chart-title">Chamadas por Tool</div>
          <div class="chart">
            @for (entry of toolEntries(); track entry.name) {
              <div class="chart-bar-container">
                <div class="chart-bar" [style.height.%]="getBarHeight(entry.count)"></div>
                <div class="chart-label">{{ entry.name }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tool Calls List -->
      <div class="toolcalls-list">
        @if (toolCalls.recentToolCalls().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="9" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="15" x2="21" y2="15"/>
              </svg>
            </div>
            <p>Nenhuma ferramenta executada</p>
            <span class="empty-hint">Tools aparecerão aqui em tempo real</span>
          </div>
        }

        @for (tool of toolCalls.recentToolCalls(); track tool.id) {
          <div class="tool-item" [class.running]="tool.status === 'running'"
                                 [class.success]="tool.status === 'success'"
                                 [class.error]="tool.status === 'error'">
            <div class="tool-header">
              <div class="tool-info">
                <span class="tool-badge">{{ tool.name }}</span>
                <span class="tool-time">{{ formatTime(tool.started_at) }}</span>
              </div>
              <span class="tool-status">
                @switch (tool.status) {
                  @case ('running') {
                    <div class="status-dot running"></div>
                  }
                  @case ('success') {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  }
                  @case ('error') {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  }
                }
              </span>
            </div>

            @if (tool.duration_ms || tool.duration) {
              <div class="tool-duration">{{ tool.duration_ms || tool.duration }}ms</div>
            }

            @if (tool.parameters) {
              <div class="tool-params">{{ formatParams(tool.parameters) }}</div>
            }

            @if (tool.error_message || tool.error) {
              <div class="tool-error">{{ tool.error_message || tool.error }}</div>
            }
          </div>
        }
      </div>

      <!-- Debug CLI Section -->
      <div class="debug-section">
        <div class="debug-header">
          <h4>Debug CLI</h4>
          <span class="debug-badge">{{ debugData()?.count ?? 0 }} eventos</span>
        </div>
        @if (debugData()?.found) {
          <div class="debug-summary">
            <div class="debug-stat">Total: {{ debugData()?.summary?.total_events ?? 0 }}</div>
            <div class="debug-stat">Tools: {{ debugData()?.summary?.tool_events ?? 0 }}</div>
            <div class="debug-stat">Arquivos: {{ debugData()?.summary?.file_writes ?? 0 }}</div>
            <div class="debug-stat">Streams: {{ debugData()?.summary?.streams ?? 0 }}</div>
          </div>
          <div class="debug-timeline">
            @for (entry of debugEntries(); track $index) {
              <div class="debug-entry" [class]="entry.event_type ?? ''">
                <span class="debug-time">{{ formatDebugTime(entry.timestamp) }}</span>
                @if (entry.event_type) {
                  <span class="debug-type">[{{ entry.event_type }}]</span>
                }
                @if (entry.tool_name) {
                  <strong>{{ entry.tool_name }}:</strong>
                }
                <span class="debug-msg">{{ truncateMsg(entry.message) }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="debug-empty">
            <p>Nenhum log de debug disponível</p>
          </div>
        }
      </div>

      <div class="panel-footer">
        @if (chat.isStreaming()) {
          <div class="status-indicator active">
            <div class="pulse-dot"></div>
            <span>Processando...</span>
          </div>
        } @else {
          <div class="status-indicator">
            <div class="idle-dot"></div>
            <span>Aguardando</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .toolcalls-panel {
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 16px;
      background: #faf9f5;
      border-bottom: 1px solid #e5e4df;
    }

    .stat-card {
      text-align: center;
      padding: 12px 8px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e5e4df;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #3d3d3d;
      margin-bottom: 4px;
    }
    .stat-value.error {
      color: #dc2626;
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9a9a9a;
    }

    /* Chart Section */
    .chart-section {
      padding: 16px;
      border-bottom: 1px solid #e5e4df;
    }

    .chart-title {
      font-size: 12px;
      font-weight: 500;
      color: #6b6b6b;
      margin-bottom: 12px;
    }

    .chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 60px;
    }

    .chart-bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .chart-bar {
      width: 100%;
      background: linear-gradient(to top, #da7756, #e89a7f);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
    }

    .chart-label {
      font-size: 9px;
      color: #9a9a9a;
      margin-top: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      text-align: center;
    }

    /* Tool Calls List */
    .toolcalls-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .toolcalls-list::-webkit-scrollbar { display: none; }

    .empty-state {
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
      font-size: 14px;
      color: #6b6b6b;
    }
    .empty-hint {
      font-size: 12px;
      color: #9a9a9a;
    }

    .tool-item {
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      transition: all 0.15s ease;
    }
    .tool-item:hover {
      border-color: #d5d4cf;
    }

    .tool-item.running {
      border-left: 3px solid #f59e0b;
      background: #fffbeb;
    }
    .tool-item.success {
      border-left: 3px solid #16a34a;
      background: #f0fdf4;
    }
    .tool-item.error {
      border-left: 3px solid #dc2626;
      background: #fef2f2;
    }

    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .tool-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tool-badge {
      font-weight: 600;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 12px;
      background: #da7756;
      color: white;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .tool-item.error .tool-badge {
      background: #dc2626;
    }

    .tool-time {
      font-size: 11px;
      color: #9a9a9a;
    }

    .tool-status {
      display: flex;
      align-items: center;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.running {
      background: #f59e0b;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    .tool-duration {
      font-size: 11px;
      font-family: 'SF Mono', 'Consolas', monospace;
      color: #da7756;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .tool-params {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 11px;
      color: #6b6b6b;
      background: #f5f4ef;
      padding: 8px 10px;
      border-radius: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tool-error {
      color: #dc2626;
      font-size: 12px;
      margin-top: 8px;
      background: #fee2e2;
      padding: 8px 10px;
      border-radius: 6px;
    }

    /* Footer */
    .panel-footer {
      padding: 12px 16px;
      border-top: 1px solid #e5e4df;
      background: #faf9f5;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      color: #9a9a9a;
    }
    .status-indicator.active {
      color: #da7756;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #da7756;
      animation: pulse 1.5s infinite;
    }

    .idle-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d5d4cf;
    }

    /* Debug CLI Section */
    .debug-section {
      border-top: 1px solid #e5e4df;
      background: #faf9f5;
    }

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e4df;
    }

    .debug-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #3d3d3d;
    }

    .debug-badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 10px;
      background: #da7756;
      color: white;
      font-weight: 500;
    }

    .debug-summary {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      flex-wrap: wrap;
    }

    .debug-stat {
      background: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      border: 1px solid #e5e4df;
      color: #3d3d3d;
    }

    .debug-timeline {
      max-height: 300px;
      overflow-y: auto;
      padding: 0 12px 12px;
    }

    .debug-entry {
      padding: 8px 10px;
      border-left: 3px solid #da7756;
      margin-bottom: 6px;
      font-family: 'SF Mono', monospace;
      font-size: 11px;
      background: #fff;
      border-radius: 0 6px 6px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: baseline;
    }

    .debug-entry.pre_hook { border-left-color: #f59e0b; }
    .debug-entry.post_hook { border-left-color: #10b981; }
    .debug-entry.file_write { border-left-color: #3b82f6; }
    .debug-entry.stream { border-left-color: #8b5cf6; }
    .debug-entry.temp_file { border-left-color: #ec4899; }

    .debug-time {
      color: #9a9a9a;
      font-size: 10px;
    }

    .debug-type {
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 3px;
      background: #f5f4ef;
      font-size: 10px;
    }

    .debug-msg {
      color: #6b6b6b;
      word-break: break-word;
    }

    .debug-empty {
      padding: 24px;
      text-align: center;
      color: #9a9a9a;
      font-size: 13px;
    }
    .debug-empty p {
      margin: 0;
    }
  `]
})
export class ToolCallsPanelComponent implements OnInit, OnDestroy {
  toolCalls = inject(ToolCallsService);
  chat = inject(ChatService);
  private configService = inject(ConfigService);

  isOpen = input<boolean>(true);
  sessionId = input<string | null>(null);
  togglePanel = output<void>();

  stats = computed(() => this.toolCalls.stats());
  debugData = signal<DebugData | null>(null);

  debugEntries = computed(() => {
    const data = this.debugData();
    if (!data?.entries) return [];
    return data.entries.slice(-50).reverse();
  });

  constructor() {
    effect(() => {
      const sid = this.sessionId();
      if (sid) {
        this.fetchDebugData(sid);
      }
    });
  }

  toolCount = computed(() => {
    const byTool = this.stats()?.by_tool;
    return byTool ? Object.keys(byTool).length : 0;
  });

  toolEntries = computed(() => {
    const byTool = this.stats()?.by_tool;
    if (!byTool) return [];
    return Object.entries(byTool)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  private maxCount = computed(() => {
    const entries = this.toolEntries();
    return entries.length > 0 ? Math.max(...entries.map(e => e.count)) : 1;
  });

  ngOnInit(): void {
    const sid = this.sessionId();
    if (sid) {
      this.toolCalls.setSessionId(sid);
    }
    this.toolCalls.startPolling(2000);
  }

  ngOnDestroy(): void {
    this.toolCalls.stopPolling();
  }

  getBarHeight(count: number): number {
    return (count / this.maxCount()) * 100;
  }

  formatTime(timestamp: number): string {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatParams(params: any): string {
    if (!params) return '';
    const str = JSON.stringify(params);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  }

  async fetchDebugData(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.configService.apiUrl}/audit/debug/${sessionId}`);
      const data = await response.json();
      this.debugData.set(data);
    } catch (err) {
      console.error('Erro ao carregar debug:', err);
      this.debugData.set(null);
    }
  }

  formatDebugTime(timestamp: string): string {
    if (!timestamp) return '';
    const timePart = timestamp.split('T')[1];
    return timePart ? timePart.replace('Z', '').substring(0, 12) : timestamp;
  }

  truncateMsg(msg: string): string {
    if (!msg) return '';
    return msg.length > 120 ? msg.substring(0, 120) + '...' : msg;
  }
}
