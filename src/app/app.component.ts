import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-layout">
      <app-sidebar (newChatRequested)="onNewChat()" />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .app-layout {
      display: flex;
      height: 100%;
      background: #faf9f5;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      min-width: 0;
    }
  `]
})
export class AppComponent {
  onNewChat(): void {
    console.log('Novo chat iniciado');
  }
}
