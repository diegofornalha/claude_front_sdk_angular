import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'new',
    pathMatch: 'full'
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/chat/chat-page.component').then(m => m.ChatPageComponent),
    data: { newChat: true }
  },
  {
    path: 'chat/:sessionId',
    loadComponent: () => import('./pages/chat/chat-page.component').then(m => m.ChatPageComponent)
  },
  {
    path: 'chat/:sessionId/audit',
    loadComponent: () => import('./pages/audit/audit-page.component').then(m => m.AuditPageComponent)
  },
  {
    path: 'recents',
    loadComponent: () => import('./pages/conversas/conversas-page.component').then(m => m.ConversasPageComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects-page.component').then(m => m.ProjectsPageComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search-page.component').then(m => m.SearchPageComponent)
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config-page.component').then(m => m.ConfigPageComponent)
  },
  {
    path: 'documents',
    loadComponent: () => import('./pages/documents/documents-page.component').then(m => m.DocumentsPageComponent)
  },
  {
    path: 'artifacts',
    children: [
      {
        path: '',
        redirectTo: 'my',
        pathMatch: 'full'
      },
      {
        path: 'my',
        loadComponent: () => import('./pages/artifacts/artifacts-page.component').then(m => m.ArtifactsPageComponent),
        data: { filter: 'my' }
      },
      {
        path: ':sessionId',
        loadComponent: () => import('./pages/artifacts/artifacts-page.component').then(m => m.ArtifactsPageComponent)
      }
    ]
  },
  {
    path: 'audit',
    loadComponent: () => import('./pages/audit/audit-page.component').then(m => m.AuditPageComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings-page.component').then(m => m.SettingsPageComponent)
  },
  {
    path: 'integrations',
    loadComponent: () => import('./pages/integrations/integrations-page.component').then(m => m.IntegrationsPageComponent)
  },
  {
    path: 'api',
    loadComponent: () => import('./pages/api/api-page.component').then(m => m.ApiPageComponent)
  },
  {
    path: '**',
    redirectTo: 'new'
  }
];
