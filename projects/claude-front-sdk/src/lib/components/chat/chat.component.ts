import { Component, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'claude-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="claude-chat" [class.has-messages]="chat.messages().length > 0">
      <!-- Área de mensagens -->
      <div class="messages">
        @for (msg of chat.messages(); track msg.id; let last = $last) {
          @if (msg.role === 'user') {
            <!-- Mensagem do usuário à direita -->
            <div class="user-message-row">
              <div class="user-bubble">{{ msg.content }}</div>
            </div>
          } @else {
            <!-- Resposta do Claude à esquerda -->
            <div class="assistant-message-row">
              @if (chat.isStreaming() && last) {
                <div class="thinking-indicator">
                  <svg
                    class="thinking-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Elaborando resposta...</span>
                </div>
              }
              <div class="assistant-content" [innerHTML]="msg.content | markdown"></div>
              @if (!chat.isStreaming() || !last) {
                <div class="message-actions">
                  <button class="action-btn" title="Copiar" (click)="copyMessage(msg.content)">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <button class="action-btn" title="Gostei">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                      />
                    </svg>
                  </button>
                  <button class="action-btn" title="Não gostei">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
                      />
                    </svg>
                  </button>
                  <button class="action-btn" title="Regenerar">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                </div>
              }
            </div>
          }
        }
        @if (chat.isStreaming() && chat.messages().length === 0) {
          <div class="assistant-message-row">
            <div class="thinking-indicator">
              <svg
                class="thinking-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>Elaborando resposta...</span>
            </div>
          </div>
        }
        @if (chat.error()) {
          <div class="error">{{ chat.error() }}</div>
        }
      </div>

      <!-- Input Container - Estilo Claude -->
      <div class="input-container">
        <!-- Input Box Principal -->
        <div class="input-box">
          <textarea
            #inputTextarea
            [(ngModel)]="inputValue"
            (keydown.enter)="onEnter($event)"
            [disabled]="chat.isStreaming()"
            [placeholder]="
              chat.messages().length === 0 ? 'Como posso ajudar você hoje?' : 'Enviar mensagem...'
            "
            rows="1"
            (input)="autoResize($event)"
          ></textarea>

          <!-- Toolbar inferior -->
          <div class="input-toolbar">
            <div class="toolbar-left">
              <!-- Botão + -->
              <div class="dropdown-container">
                <button
                  class="toolbar-btn add-btn"
                  (click)="toggleAddMenu()"
                  [class.active]="isAddMenuOpen()"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                @if (isAddMenuOpen()) {
                  <div class="dropdown-menu">
                    <button class="menu-item" (click)="selectMenuItem('files')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                        />
                      </svg>
                      <span>Adicionar arquivos ou fotos</span>
                    </button>
                    <button class="menu-item" (click)="selectMenuItem('screenshot')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span>Fazer captura de tela</span>
                    </button>
                    <button class="menu-item has-submenu" (click)="selectMenuItem('project')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        />
                      </svg>
                      <span>Adicionar ao projeto</span>
                      <svg
                        class="chevron"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <div class="menu-divider"></div>

                    <button class="menu-item" (click)="selectMenuItem('research')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span>Pesquisa</span>
                    </button>
                    <button
                      class="menu-item"
                      [class.selected]="webSearchEnabled()"
                      (click)="toggleWebSearch()"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path
                          d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                        />
                      </svg>
                      <span>Busca na web</span>
                      @if (webSearchEnabled()) {
                        <svg
                          class="check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#2563eb"
                          stroke-width="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      }
                    </button>
                    <button class="menu-item has-submenu" (click)="selectMenuItem('style')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                        <path d="M2 2l7.586 7.586" />
                        <circle cx="11" cy="11" r="2" />
                      </svg>
                      <span>Usar estilo</span>
                      <svg
                        class="chevron"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                    <button class="menu-item" (click)="selectMenuItem('connectors')">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>Adicionar conectores</span>
                    </button>
                  </div>
                }
              </div>

              <!-- Botão histórico -->
              <button class="toolbar-btn history-btn" title="Histórico">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
            </div>

            <div class="toolbar-right">
              <!-- Seletor de modelo -->
              <div class="model-selector" (click)="toggleModelMenu()">
                <span class="model-name">{{ selectedModel() }}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>

                @if (isModelMenuOpen()) {
                  <div class="model-dropdown">
                    @for (model of models; track model.id) {
                      <button
                        class="model-option"
                        [class.selected]="selectedModel() === model.name"
                        (click)="selectModel(model); $event.stopPropagation()"
                      >
                        <span class="model-name">{{ model.name }}</span>
                        <span class="model-desc">{{ model.description }}</span>
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Botão enviar -->
              <button
                class="send-btn"
                (click)="send()"
                [disabled]="chat.isStreaming() || !inputValue.trim()"
                title="Enviar mensagem"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay para fechar menus -->
    @if (isAddMenuOpen() || isModelMenuOpen()) {
      <div class="overlay" (click)="closeMenus()"></div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .claude-chat {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #faf9f5;
      }

      /* Mensagens */
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .messages::-webkit-scrollbar {
        display: none;
      }

      /* Mensagem do usuário - à direita com fundo bege */
      .user-message-row {
        display: flex;
        justify-content: flex-end;
        padding: 8px 0;
      }
      .user-bubble {
        background: #f5f0e8;
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 18px;
        max-width: 70%;
        font-size: 15px;
        line-height: 1.5;
      }

      /* Resposta do Claude - à esquerda sem balão */
      .assistant-message-row {
        padding: 16px 0;
      }
      .assistant-content {
        color: #1a1a1a;
        font-size: 15px;
        line-height: 1.7;
        word-break: break-word;
      }

      /* Indicador de pensamento */
      .thinking-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b6b6b;
        font-size: 14px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f5f4ef;
        border-radius: 8px;
        width: fit-content;
      }
      .thinking-icon {
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }

      /* Botões de ação */
      .message-actions {
        display: flex;
        gap: 4px;
        margin-top: 12px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .assistant-message-row:hover .message-actions {
        opacity: 1;
      }
      .action-btn {
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
      .action-btn:hover {
        background: #f5f4ef;
        color: #3d3d3d;
      }

      /* Markdown styles */
      .assistant-content h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 16px 0 8px;
        color: inherit;
      }
      .assistant-content h2:first-child {
        margin-top: 0;
      }
      .assistant-content h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 12px 0 6px;
        color: inherit;
      }
      .assistant-content strong {
        font-weight: 600;
      }
      .assistant-content em {
        font-style: italic;
      }
      .assistant-content code {
        background: rgba(0, 0, 0, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        font-size: 0.9em;
      }
      .assistant-content pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 12px 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 12px 0;
      }
      .assistant-content pre code {
        background: transparent;
        padding: 0;
        font-size: 13px;
      }
      .assistant-content ul,
      .assistant-content ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      .assistant-content li {
        margin: 4px 0;
      }
      .assistant-content p {
        margin: 8px 0;
      }
      .assistant-content p:first-child {
        margin-top: 0;
      }
      .assistant-content a {
        color: #2563eb;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.15s ease;
      }
      .assistant-content a:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }
      .assistant-content a.internal-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: #eff6ff;
        border-radius: 6px;
        font-size: 14px;
      }
      .assistant-content a.internal-link:hover {
        background: #dbeafe;
        text-decoration: none;
      }

      /* Typing indicator */
      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 16px 20px;
        align-self: flex-start;
      }
      .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #da7756;
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;
      }
      .typing-indicator span:nth-child(1) {
        animation-delay: -0.32s;
      }
      .typing-indicator span:nth-child(2) {
        animation-delay: -0.16s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
      }

      .error {
        color: #dc3545;
        text-align: center;
        padding: 12px;
        font-size: 14px;
      }

      /* Input Container */
      .input-container {
        padding: 16px 24px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      /* Quando não há mensagens, centralizar verticalmente */
      .claude-chat:not(.has-messages) {
        justify-content: center;
      }
      .claude-chat:not(.has-messages) .messages {
        display: none;
      }
      .claude-chat:not(.has-messages) .input-container {
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
      }

      /* Chips de sugestão */
      .suggestion-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 20px;
        font-size: 14px;
        color: #3d3d3d;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .chip:hover {
        background: #f5f4ef;
        border-color: #d5d4cf;
      }
      .chip-icon {
        display: flex;
        opacity: 0.7;
      }

      /* Input Box */
      .input-box {
        width: 100%;
        max-width: 680px;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 24px;
        padding: 16px 20px 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .input-box:focus-within {
        border-color: #da7756;
        box-shadow: 0 2px 12px rgba(218, 119, 86, 0.15);
      }

      textarea {
        width: 100%;
        border: none;
        outline: none;
        resize: none;
        font-size: 16px;
        line-height: 1.5;
        color: #3d3d3d;
        background: transparent;
        min-height: 24px;
        max-height: 200px;
      }
      textarea::placeholder {
        color: #9a9a9a;
      }

      /* Toolbar */
      .input-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding-top: 8px;
      }

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: #f5f4ef;
        border-radius: 8px;
        cursor: pointer;
        color: #6b6b6b;
        transition: all 0.15s ease;
      }
      .toolbar-btn:hover {
        background: #e8e7e2;
        color: #3d3d3d;
      }
      .toolbar-btn.active {
        background: #e8e7e2;
      }

      .history-btn {
        color: #2563eb;
        background: #eff6ff;
      }
      .history-btn:hover {
        background: #dbeafe;
      }

      /* Dropdown container */
      .dropdown-container {
        position: relative;
      }

      .dropdown-menu {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        min-width: 280px;
        padding: 8px;
        z-index: 1000;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: transparent;
        border-radius: 8px;
        font-size: 14px;
        color: #3d3d3d;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s ease;
      }
      .menu-item:hover {
        background: #f5f4ef;
      }
      .menu-item.selected span:first-of-type {
        color: #2563eb;
      }
      .menu-item .chevron {
        margin-left: auto;
        opacity: 0.5;
      }
      .menu-item .check {
        margin-left: auto;
      }

      .menu-divider {
        height: 1px;
        background: #e5e4df;
        margin: 8px 0;
      }

      /* Model selector */
      .model-selector {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: #6b6b6b;
        font-size: 14px;
        position: relative;
        transition: background 0.15s ease;
      }
      .model-selector:hover {
        background: #f5f4ef;
      }

      .model-dropdown {
        position: absolute;
        bottom: 100%;
        right: 0;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid #e5e4df;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        min-width: 200px;
        padding: 8px;
        z-index: 1000;
      }

      .model-option {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s ease;
      }
      .model-option:hover {
        background: #f5f4ef;
      }
      .model-option.selected {
        background: #fef3ed;
      }
      .model-option .model-name {
        font-size: 14px;
        font-weight: 500;
        color: #3d3d3d;
      }
      .model-option .model-desc {
        font-size: 12px;
        color: #9a9a9a;
      }

      /* Send button */
      .send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: #da7756;
        border-radius: 10px;
        cursor: pointer;
        color: white;
        transition: all 0.15s ease;
      }
      .send-btn:hover:not(:disabled) {
        background: #c96a4b;
      }
      .send-btn:disabled {
        background: #e5e4df;
        color: #9a9a9a;
        cursor: not-allowed;
      }

      /* Overlay */
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
      }

      /* Responsivo */
      @media (max-width: 768px) {
        .input-container {
          padding: 12px 16px 16px;
        }
        .input-box {
          border-radius: 20px;
          padding: 12px 16px 10px;
        }
        .suggestion-chips {
          gap: 6px;
        }
        .chip {
          padding: 8px 12px;
          font-size: 13px;
        }
      }
    `,
  ],
})
export class ChatComponent {
  chat = inject(ChatService);
  private router = inject(Router);

  // Intercepta cliques em links internos para usar Angular Router
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' && target.classList.contains('internal-link')) {
      event.preventDefault();
      const route = target.getAttribute('data-route');
      if (route) {
        this.router.navigate([route]);
      }
    }
  }

  isAddMenuOpen = signal(false);
  isModelMenuOpen = signal(false);
  webSearchEnabled = signal(true);
  selectedModel = signal('Opus 4.5');

  models = [
    { id: 'opus', name: 'Opus 4.5', description: 'Mais capaz e criativo' },
    { id: 'sonnet', name: 'Sonnet 4', description: 'Equilíbrio ideal' },
    { id: 'haiku', name: 'Haiku 3.5', description: 'Rápido e eficiente' },
  ];

  suggestionChips = [
    {
      label: 'Código',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      prompt: 'Me ajude a escrever código',
    },
    {
      label: 'Chat de carreira',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      prompt: 'Quero discutir sobre minha carreira',
    },
    {
      label: 'Escolha do Claude',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      prompt: 'Me surpreenda com algo interessante',
    },
  ];

  get inputValue(): string {
    return this.chat.input();
  }

  set inputValue(value: string) {
    this.chat.input.set(value);
  }

  send(): void {
    if (this.inputValue.trim()) {
      this.chat.send();
    }
  }

  onEnter(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  toggleAddMenu(): void {
    this.isAddMenuOpen.update(v => !v);
    this.isModelMenuOpen.set(false);
  }

  toggleModelMenu(): void {
    this.isModelMenuOpen.update(v => !v);
    this.isAddMenuOpen.set(false);
  }

  closeMenus(): void {
    this.isAddMenuOpen.set(false);
    this.isModelMenuOpen.set(false);
  }

  selectMenuItem(item: string): void {
    console.log('Menu item selected:', item);
    this.closeMenus();
  }

  toggleWebSearch(): void {
    this.webSearchEnabled.update(v => !v);
  }

  selectModel(model: { id: string; name: string; description: string }): void {
    this.selectedModel.set(model.name);
    this.chat.setModel(model.id as 'haiku' | 'sonnet' | 'opus');
    this.closeMenus();
  }

  useSuggestion(prompt: string): void {
    this.inputValue = prompt;
  }

  copyMessage(content: string): void {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        console.log('Mensagem copiada!');
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
      });
  }
}
