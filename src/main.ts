import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { provideClaude } from '../projects/claude-front-sdk/src/lib/services/config.service';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideClaude({
      apiUrl: 'http://localhost:8001',
      apiKey: 'rag_ol8q9wJtY4ERFjBdgFH2BKgCXqQl3qMqa8cWmuQXw1k',
      streaming: true,
      defaultModel: 'haiku'
    })
  ]
}).catch(err => console.error(err));
