import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-page">
      <h1>Configurações</h1>
      <p class="placeholder">Configurações do sistema aparecerão aqui.</p>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: 32px;
      background: #faf9f5;
      height: 100%;
    }
    h1 {
      color: #3d3d3d;
      font-size: 24px;
      margin-bottom: 16px;
    }
    .placeholder {
      color: #6b6b6b;
    }
  `]
})
export class SettingsPageComponent {}
