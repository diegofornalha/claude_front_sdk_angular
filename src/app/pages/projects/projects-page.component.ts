import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="projects-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Projetos</h1>
        <button class="new-project-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo projeto
        </button>
      </div>

      <!-- Search -->
      <div class="search-container">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Procurar projetos..."
          class="search-input"
        />
      </div>

      <!-- Tabs and Sort -->
      <div class="filters-row">
        <div class="tabs">
          <button
            class="tab"
            [class.active]="activeTab() === 'seus'"
            (click)="setTab('seus')">
            Seus projetos
          </button>
          <button
            class="tab"
            [class.active]="activeTab() === 'equipe'"
            (click)="setTab('equipe')">
            Equipe
          </button>
          <button
            class="tab"
            [class.active]="activeTab() === 'compartilhado'"
            (click)="setTab('compartilhado')">
            Compartilhado com você
          </button>
        </div>

        <div class="sort-container">
          <span class="sort-label">Ordenar por</span>
          <div class="sort-dropdown" (click)="toggleSortMenu()">
            <span>{{ sortBy() }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          @if (isSortMenuOpen()) {
            <div class="sort-menu">
              <button (click)="setSortBy('Atividade')">Atividade</button>
              <button (click)="setSortBy('Nome')">Nome</button>
              <button (click)="setSortBy('Data de criação')">Data de criação</button>
            </div>
          }
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <!-- Blocks -->
            <rect x="15" y="15" width="20" height="20" rx="2" stroke="#3d3d3d" stroke-width="2" fill="none"/>
            <rect x="40" y="15" width="20" height="20" rx="2" stroke="#3d3d3d" stroke-width="2" fill="none"/>
            <rect x="28" y="35" width="16" height="16" rx="2" fill="#e5e4df"/>
            <!-- Hand -->
            <path d="M45 50 L45 65 Q45 70 50 70 L60 70 Q65 70 65 65 L65 55" stroke="#3d3d3d" stroke-width="2" fill="none"/>
            <path d="M50 55 L50 50" stroke="#3d3d3d" stroke-width="2"/>
            <path d="M55 55 L55 48" stroke="#3d3d3d" stroke-width="2"/>
            <path d="M60 55 L60 50" stroke="#3d3d3d" stroke-width="2"/>
          </svg>
        </div>
        <h2>Quer começar um projeto?</h2>
        <p>
          Faça upload de materiais, defina instruções<br>
          personalizadas e organize conversas em um só lugar.
        </p>
        <button class="new-project-btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo projeto
        </button>
      </div>
    </div>
  `,
  styles: [`
    .projects-page {
      padding: 32px;
      background: #faf9f5;
      height: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    h1 {
      color: #3d3d3d;
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }

    .new-project-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #1a1a1a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .new-project-btn:hover {
      background: #2a2a2a;
    }

    /* Search */
    .search-container {
      position: relative;
      margin-bottom: 16px;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #9a9a9a;
    }

    .search-input {
      width: 100%;
      padding: 14px 16px 14px 48px;
      border: 2px solid #e5e4df;
      border-radius: 12px;
      font-size: 15px;
      color: #3d3d3d;
      background: #fff;
      transition: border-color 0.2s ease;
    }
    .search-input:focus {
      outline: none;
      border-color: #2563eb;
    }
    .search-input::placeholder {
      color: #9a9a9a;
    }

    /* Filters Row */
    .filters-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 48px;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
    }

    .tab {
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 20px;
      font-size: 14px;
      color: #6b6b6b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab:hover {
      background: #e8e7e2;
      color: #3d3d3d;
    }
    .tab.active {
      background: #3d3d3d;
      color: white;
    }

    /* Sort */
    .sort-container {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .sort-label {
      font-size: 14px;
      color: #6b6b6b;
    }

    .sort-dropdown {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      font-size: 14px;
      color: #3d3d3d;
      background: #fff;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }
    .sort-dropdown:hover {
      border-color: #d5d4cf;
    }

    .sort-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: #fff;
      border: 1px solid #e5e4df;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 160px;
      z-index: 10;
    }
    .sort-menu button {
      display: block;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: transparent;
      text-align: left;
      font-size: 14px;
      color: #3d3d3d;
      cursor: pointer;
    }
    .sort-menu button:hover {
      background: #f5f4ef;
    }
    .sort-menu button:first-child {
      border-radius: 8px 8px 0 0;
    }
    .sort-menu button:last-child {
      border-radius: 0 0 8px 8px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-icon {
      margin-bottom: 24px;
    }

    .empty-state h2 {
      font-size: 20px;
      font-weight: 600;
      color: #3d3d3d;
      margin: 0 0 12px;
    }

    .empty-state p {
      font-size: 15px;
      color: #6b6b6b;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .new-project-btn-outline {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: transparent;
      color: #3d3d3d;
      border: 1px solid #d5d4cf;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .new-project-btn-outline:hover {
      background: #f5f4ef;
      border-color: #c5c4bf;
    }
  `]
})
export class ProjectsPageComponent {
  searchQuery = '';
  activeTab = signal<'seus' | 'equipe' | 'compartilhado'>('seus');
  sortBy = signal('Atividade');
  isSortMenuOpen = signal(false);

  setTab(tab: 'seus' | 'equipe' | 'compartilhado'): void {
    this.activeTab.set(tab);
  }

  toggleSortMenu(): void {
    this.isSortMenuOpen.update(v => !v);
  }

  setSortBy(value: string): void {
    this.sortBy.set(value);
    this.isSortMenuOpen.set(false);
  }
}
