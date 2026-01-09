import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { provideClaude } from '../projects/claude-front-sdk/src/lib/services/config.service';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideClaude({
      apiUrl: environment.apiUrl,
      apiVersion: environment.apiVersion,
      apiKey: environment.apiKey || undefined,
      streaming: environment.streaming,
      defaultModel: environment.defaultModel,
      timeout: environment.timeout,
    }),
  ],
}).catch(err => console.error(err));
