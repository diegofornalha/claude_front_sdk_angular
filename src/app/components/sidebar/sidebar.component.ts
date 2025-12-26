import { Component, signal, output, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../../../projects/claude-front-sdk/src/lib/services/session.service';
import { ChatService } from '../../../../projects/claude-front-sdk/src/lib/services/chat.service';
import { Session } from '../../../../projects/claude-front-sdk/src/lib/models/session.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Toggle sidebar -->
      <button class="sidebar-toggle" (click)="toggleSidebar()" [title]="isCollapsed() ? 'Expandir menu' : 'Recolher menu'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>

      <!-- New Chat - Destaque laranja -->
      <button class="nav-item new-chat" routerLink="/new" routerLinkActive="active" (click)="onNewChat()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Novo bate-papo</span>
        }
      </button>

      <!-- Recentes -->
      <button class="nav-item" routerLink="/recents" routerLinkActive="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Recentes</span>
        }
      </button>

      <!-- Projects -->
      <button class="nav-item" routerLink="/projects" routerLinkActive="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Projetos</span>
        }
      </button>

      <!-- Artefatos -->
      <button class="nav-item" routerLink="/artifacts/my" routerLinkActive="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="5" cy="5" r="2"/>
          <circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
          <line x1="5" y1="7" x2="5" y2="17"/>
          <line x1="19" y1="7" x2="19" y2="17"/>
          <line x1="7" y1="5" x2="17" y2="5"/>
          <line x1="7" y1="19" x2="17" y2="19"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Artefatos</span>
        }
      </button>

      <!-- Search -->
      <button class="nav-item" routerLink="/search" routerLinkActive="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Busca</span>
        }
      </button>

      <!-- Config -->
      <button class="nav-item" routerLink="/config" routerLinkActive="active">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        @if (!isCollapsed()) {
          <span>Config</span>
        }
      </button>

      <!-- Favoritos (só aparece se tiver favoritos) -->
      @if (!isCollapsed() && favoriteChats().length > 0) {
        <div class="recents-section favorites-section">
          <span class="recents-label">FAVORITOS</span>
          @for (chat of favoriteChats(); track chat.id) {
            <ng-container *ngTemplateOutlet="chatItem; context: { chat: chat }"></ng-container>
          }
        </div>
      }

      <!-- Recentes (não favoritos) -->
      @if (!isCollapsed()) {
        <div class="recents-section">
          <span class="recents-label">RECENTES</span>
          @if (nonFavoriteChats().length === 0) {
            <p class="empty-message">Seus chats aparecerão aqui</p>
          }
          @for (chat of nonFavoriteChats(); track chat.id) {
            <ng-container *ngTemplateOutlet="chatItem; context: { chat: chat }"></ng-container>
          }
        </div>
      }

      <!-- Template reutilizável para item de chat -->
      <ng-template #chatItem let-chat="chat">
        <div class="recent-item-container" [class.menu-open]="activeRecentMenu() === chat.id">
          <button class="recent-item" [routerLink]="['/chat', chat.id]">
            @if (chat.favorite) {
              <svg class="favorite-star" width="12" height="12" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }
            <span class="recent-title">{{ chat.titulo }}</span>
          </button>
          <button class="recent-menu-btn" (click)="toggleRecentMenu(chat.id, $event)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          @if (activeRecentMenu() === chat.id) {
            <div class="recent-dropdown">
              <button class="dropdown-item" (click)="favoriteChat(chat.id)">
                @if (chat.favorite) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706" stroke-width="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Desfavoritar</span>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Favoritar</span>
                }
              </button>
              <button class="dropdown-item" (click)="openRenameModal(chat.id, chat.titulo)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
                <span>Mudar o nome</span>
              </button>
              <button class="dropdown-item" (click)="addToProject(chat.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Adicionar ao projeto</span>
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item delete" (click)="deleteChat(chat.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Apagar</span>
              </button>
            </div>
          }
        </div>
      </ng-template>

      <!-- Spacer -->
      <div class="spacer"></div>

      <!-- Avatar/User Menu -->
      <div class="user-menu-container">
        <button class="user-btn" (click)="toggleUserMenu()" [class.active]="isUserMenuOpen()">
          <div class="avatar">
            <span class="avatar-letter">A</span>
            <div class="avatar-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
          </div>
          @if (!isCollapsed()) {
            <div class="user-info-inline">
              <span class="user-title">Convidado</span>
              <span class="user-subtitle">Modo visitante</span>
            </div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          }
        </button>

        @if (isUserMenuOpen()) {
          <div class="user-dropdown" [class.collapsed-menu]="isCollapsed()">
            <div class="dropdown-header">
              <div class="user-info">
                <span class="user-name">Convidado</span>
                <span class="user-email">Modo visitante</span>
              </div>
            </div>

            <div class="dropdown-divider"></div>

            <button class="dropdown-item" (click)="selectMenuItem('settings')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Configurações</span>
            </button>

            <button class="dropdown-item" (click)="selectMenuItem('integrations')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="6" cy="6" r="2"/>
                <circle cx="18" cy="6" r="2"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <line x1="6" y1="8" x2="6" y2="16"/>
                <line x1="18" y1="8" x2="18" y2="16"/>
                <line x1="8" y1="6" x2="10" y2="6"/>
                <line x1="14" y1="6" x2="16" y2="6"/>
              </svg>
              <span>Integrações</span>
            </button>

            <button class="dropdown-item" (click)="selectMenuItem('api')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span>API</span>
            </button>

            <div class="dropdown-divider"></div>

            <button class="dropdown-item" (click)="selectMenuItem('help')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Ajuda</span>
            </button>

            <button class="dropdown-item login-btn" (click)="selectMenuItem('login')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Entrar</span>
            </button>
          </div>
        }
      </div>
    </aside>

    <!-- Overlay para fechar menu -->
    @if (isUserMenuOpen()) {
      <div class="menu-overlay" (click)="closeUserMenu()"></div>
    }
    @if (activeRecentMenu()) {
      <div class="menu-overlay" (click)="closeRecentMenu()"></div>
    }

    <!-- Modal de Renomear -->
    @if (isRenameModalOpen()) {
      <div class="rename-modal-backdrop" (click)="closeRenameModal()">
        <div class="rename-modal" (click)="$event.stopPropagation()">
          <div class="rename-modal-header">
            <h3>Renomear conversa</h3>
            <button class="rename-modal-close" (click)="closeRenameModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="rename-modal-body">
            <input
              type="text"
              class="rename-input"
              [value]="renameModalTitle()"
              (input)="onRenameInputChange($event)"
              (keydown)="onRenameKeydown($event)"
              placeholder="Nome da conversa"
              autofocus
            />
          </div>
          <div class="rename-modal-footer">
            <button class="rename-btn cancel" (click)="closeRenameModal()">Cancelar</button>
            <button class="rename-btn confirm" (click)="confirmRename()">Salvar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 240px;
      height: 100vh;
      background: #f5f4ef;
      border-right: 1px solid #e5e4df;
      padding: 12px 8px;
      gap: 4px;
      transition: width 0.2s ease;
      position: relative;
      z-index: 100;
      overflow: visible;
    }

    .sidebar.collapsed {
      width: 56px;
    }

    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #6b6b6b;
      margin-bottom: 8px;
    }
    .sidebar-toggle:hover {
      background: #e8e7e2;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #3d3d3d;
      font-size: 14px;
      text-align: left;
      transition: background 0.15s ease;
    }
    .nav-item:hover {
      background: #e8e7e2;
    }
    .nav-item.active {
      background: #e8e7e2;
    }
    .nav-item svg {
      flex-shrink: 0;
    }
    .nav-item span {
      white-space: nowrap;
      overflow: hidden;
    }

    /* New Chat - Estilo destaque laranja */
    .new-chat {
      background: #da7756;
      color: white;
    }
    .new-chat:hover {
      background: #c96a4b;
    }
    .new-chat.active {
      background: #c96a4b;
    }

    .spacer {
      flex: 1;
    }

    /* Recentes */
    .recents-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e4df;
      max-height: calc(100vh - 400px);
      overflow-y: auto;
      overflow-x: visible;
      position: relative;
    }
    .recents-section:has(.menu-open) {
      overflow: visible;
    }
    .recents-section::-webkit-scrollbar {
      width: 4px;
    }
    .recents-section::-webkit-scrollbar-track {
      background: transparent;
    }
    .recents-section::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }

    .recents-label {
      font-size: 11px;
      font-weight: 600;
      color: #9a9a9a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 12px 8px;
    }

    .recent-item {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #6b6b6b;
      font-size: 13px;
      text-align: left;
      transition: all 0.15s ease;
    }
    .favorite-star {
      flex-shrink: 0;
    }
    .recent-item:hover {
      background: #e8e7e2;
      color: #3d3d3d;
    }
    .recent-item svg {
      flex-shrink: 0;
      opacity: 0.6;
    }
    .recent-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Recent Item Container com menu 3 pontos */
    .recent-item-container {
      display: flex;
      align-items: center;
      position: relative;
      border-radius: 6px;
    }
    .recent-item-container:hover {
      background: #e8e7e2;
    }
    .recent-item-container:hover .recent-menu-btn {
      opacity: 1;
    }
    .recent-item-container.menu-open {
      background: #e8e7e2;
    }
    .recent-item-container.menu-open .recent-menu-btn {
      opacity: 1;
    }
    .recent-item-container .recent-item {
      flex: 1;
      min-width: 0;
    }
    .recent-item-container .recent-item:hover {
      background: transparent;
    }

    .recent-menu-btn {
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
      opacity: 0;
      transition: opacity 0.15s ease, background 0.15s ease;
      flex-shrink: 0;
      margin-right: 4px;
    }
    .recent-menu-btn:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    .recent-dropdown {
      position: absolute;
      top: 0;
      left: 100%;
      margin-left: 4px;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      min-width: 160px;
      padding: 4px;
      z-index: 9999;
      pointer-events: auto;
    }

    .recent-dropdown .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 13px;
      color: #3d3d3d;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }
    .recent-dropdown .dropdown-item:hover {
      background: #f5f4ef;
    }
    .recent-dropdown .dropdown-item svg {
      color: #6b6b6b;
      flex-shrink: 0;
    }
    .recent-dropdown .dropdown-item.delete {
      color: #dc2626;
    }
    .recent-dropdown .dropdown-item.delete svg {
      color: #dc2626;
    }
    .recent-dropdown .dropdown-item.delete:hover {
      background: #fef2f2;
    }

    /* User Menu Container */
    .user-menu-container {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .user-btn:hover {
      background: #e8e7e2;
    }
    .user-btn.active {
      background: #e8e7e2;
    }

    .avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .avatar-letter {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    .avatar-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: #1a1a1a;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: 2px solid #f5f4ef;
    }

    .user-info-inline {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
      min-width: 0;
    }

    .user-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.2;
    }

    .user-subtitle {
      font-size: 12px;
      color: #6b6b6b;
      line-height: 1.2;
    }

    .chevron {
      color: #6b6b6b;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .user-btn.active .chevron {
      transform: rotate(180deg);
    }

    /* User Dropdown */
    .user-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: 8px;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      min-width: 220px;
      padding: 8px;
      z-index: 1001;
    }
    .user-dropdown.collapsed-menu {
      left: 48px;
      bottom: 0;
    }

    .dropdown-header {
      padding: 12px;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #3d3d3d;
    }
    .user-email {
      font-size: 12px;
      color: #9a9a9a;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e4df;
      margin: 4px 0;
    }

    .dropdown-item {
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
    .dropdown-item:hover {
      background: #f5f4ef;
    }
    .dropdown-item svg {
      color: #6b6b6b;
    }

    .login-btn {
      color: #da7756;
    }
    .login-btn svg {
      color: #da7756;
    }

    /* Collapsed state */
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 10px;
    }
    .sidebar.collapsed .sidebar-toggle {
      margin-left: 0;
      margin-right: 0;
    }
    .sidebar.collapsed .user-btn {
      justify-content: center;
      padding: 8px;
    }
    .sidebar.collapsed .avatar {
      margin: 0;
    }

    /* Menu Overlay */
    .menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
    }

    /* Garantir que dropdown fique acima do overlay */
    .recent-item-container.menu-open {
      position: relative;
      z-index: 1001;
    }

    /* Seção de Favoritos */
    .favorites-section {
      border-top: none;
      margin-top: 8px;
      padding-top: 8px;
    }
    .favorites-section .recents-label {
      color: #d97706;
    }

    /* Mensagem vazia */
    .empty-message {
      font-size: 13px;
      color: #9a9a9a;
      padding: 12px;
      text-align: center;
      font-style: italic;
    }

    /* Modal de Renomear */
    .rename-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .rename-modal {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 400px;
      max-width: 90vw;
      overflow: hidden;
    }

    .rename-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e4df;
    }
    .rename-modal-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .rename-modal-close {
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
    .rename-modal-close:hover {
      background: #f5f4ef;
    }

    .rename-modal-body {
      padding: 20px;
    }

    .rename-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      font-size: 14px;
      color: #1a1a1a;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .rename-input:focus {
      border-color: #da7756;
    }

    .rename-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e5e4df;
      background: #f9f9f7;
    }

    .rename-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .rename-btn.cancel {
      background: transparent;
      border: 1px solid #e5e4df;
      color: #6b6b6b;
    }
    .rename-btn.cancel:hover {
      background: #f5f4ef;
    }
    .rename-btn.confirm {
      background: #da7756;
      border: none;
      color: white;
    }
    .rename-btn.confirm:hover {
      background: #c96a4b;
    }
  `]
})
export class SidebarComponent implements OnInit {
  private sessionService = inject(SessionService);
  private chatService = inject(ChatService);

  isCollapsed = signal(false);
  isUserMenuOpen = signal(false);
  activeRecentMenu = signal<string | null>(null);
  newChatRequested = output<void>();

  // Sessões recentes (últimas 15)
  recentChats = computed(() => {
    const sessions = this.sessionService.sessions();
    return sessions
      .slice()
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 15)
      .map(s => ({
        id: s.session_id,
        titulo: this.getSessionTitle(s),
        favorite: s.favorite || false,
        projectId: s.project_id || null
      }));
  });

  // Chats favoritos (separados)
  favoriteChats = computed(() => {
    return this.recentChats().filter(c => c.favorite);
  });

  // Chats não favoritos
  nonFavoriteChats = computed(() => {
    return this.recentChats().filter(c => !c.favorite);
  });

  // Estados do modal de renomear
  isRenameModalOpen = signal(false);
  renameModalChatId = signal<string | null>(null);
  renameModalTitle = signal('');

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    try {
      await this.sessionService.list();
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }

  private getSessionTitle(session: Session): string {
    // Prioridade: título customizado > file_name > session_id abreviado
    if (session.title) {
      return session.title;
    }
    if (session.file_name) {
      return session.file_name.replace('.jsonl', '').slice(0, 20);
    }
    return session.session_id.slice(0, 8) + '...';
  }

  toggleSidebar(): void {
    this.isCollapsed.update(v => !v);
  }

  async onNewChat(): Promise<void> {
    // Chamar /reset para criar nova sessão no backend
    // Isso garante que JSONL e DB usem o mesmo ID
    try {
      const resetResponse = await this.sessionService.reset();
      // Limpar mensagens do chat para começar do zero
      this.chatService.clear();
      // Atualizar o session_id do ChatService com o novo ID
      if (resetResponse.new_session_id) {
        this.chatService.setSession(resetResponse.new_session_id);
        console.log('[Sidebar] Nova sessão criada:', resetResponse.new_session_id);
      }
    } catch (error) {
      console.error('[Sidebar] Erro ao resetar sessão:', error);
    }
    this.newChatRequested.emit();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  selectMenuItem(item: string): void {
    console.log('Menu item selected:', item);
    this.closeUserMenu();
    // Aqui você pode adicionar navegação ou ações específicas
  }

  toggleRecentMenu(chatId: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeRecentMenu() === chatId) {
      this.activeRecentMenu.set(null);
    } else {
      this.activeRecentMenu.set(chatId);
    }
  }

  closeRecentMenu(): void {
    this.activeRecentMenu.set(null);
  }

  async renameChat(chatId: string): Promise<void> {
    // Buscar o título atual
    const chat = this.recentChats().find(c => c.id === chatId);
    const currentTitle = chat?.titulo || '';

    const newName = prompt('Novo nome para o chat:', currentTitle);
    if (newName && newName.trim() && newName !== currentTitle) {
      try {
        await this.sessionService.rename(chatId, newName.trim());
        await this.loadSessions();
      } catch (error) {
        console.error('Erro ao renomear chat:', error);
        alert('Erro ao renomear: ' + (error as Error).message);
      }
    }
    this.closeRecentMenu();
  }

  // Modal de renomear
  openRenameModal(chatId: string, currentTitle: string): void {
    this.renameModalChatId.set(chatId);
    this.renameModalTitle.set(currentTitle);
    this.isRenameModalOpen.set(true);
    this.closeRecentMenu();
  }

  closeRenameModal(): void {
    this.isRenameModalOpen.set(false);
    this.renameModalChatId.set(null);
    this.renameModalTitle.set('');
  }

  async confirmRename(): Promise<void> {
    const chatId = this.renameModalChatId();
    const newTitle = this.renameModalTitle().trim();

    if (!chatId || !newTitle) {
      this.closeRenameModal();
      return;
    }

    try {
      await this.sessionService.rename(chatId, newTitle);
      await this.loadSessions();
    } catch (error) {
      console.error('Erro ao renomear chat:', error);
    }
    this.closeRenameModal();
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameModalTitle.set(input.value);
  }

  onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.confirmRename();
    } else if (event.key === 'Escape') {
      this.closeRenameModal();
    }
  }

  async favoriteChat(chatId: string): Promise<void> {
    console.log('[Sidebar] favoriteChat chamado:', chatId);
    const chat = this.recentChats().find(c => c.id === chatId);
    console.log('[Sidebar] chat encontrado:', chat);
    const currentFavorite = chat?.favorite || false;
    console.log('[Sidebar] currentFavorite:', currentFavorite, '-> novo:', !currentFavorite);

    try {
      await this.sessionService.setFavorite(chatId, !currentFavorite);
      console.log('[Sidebar] setFavorite concluído');
      await this.loadSessions();
    } catch (error) {
      console.error('Erro ao favoritar chat:', error);
      alert('Erro ao favoritar: ' + (error as Error).message);
    }
    this.closeRecentMenu();
  }

  addToProject(chatId: string): void {
    // Mostrar lista de projetos disponíveis
    const projectName = prompt('Nome do projeto para adicionar este chat:');
    if (projectName && projectName.trim()) {
      this.sessionService.setProject(chatId, projectName.trim())
        .then(() => this.loadSessions())
        .catch(error => {
          console.error('Erro ao adicionar ao projeto:', error);
          alert('Erro ao adicionar ao projeto: ' + (error as Error).message);
        });
    }
    this.closeRecentMenu();
  }

  async deleteChat(chatId: string): Promise<void> {
    if (confirm('Tem certeza que deseja apagar este chat?')) {
      try {
        await this.sessionService.delete(chatId);
        await this.loadSessions();
      } catch (error) {
        console.error('Erro ao deletar chat:', error);
      }
    }
    this.closeRecentMenu();
  }
}
