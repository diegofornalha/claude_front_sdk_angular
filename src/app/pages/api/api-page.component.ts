import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-api-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="api-page">
      <h1>API</h1>
      <p class="placeholder">Documentação e chaves de API aparecerão aqui.</p>
    </div>
  `,
  styles: [`
    .api-page {
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
export class ApiPageComponent {}
