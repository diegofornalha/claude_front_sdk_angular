# Claude Front SDK Angular

SDK Angular profissional para integração com Claude RAG Backend. Implementa padrões oficiais do Angular para AI/LLM.

## 🏗️ Arquitetura

```
claude_front_sdk_angular/
├── projects/claude-front-sdk/    # SDK Library (publicável)
│   └── src/lib/
│       ├── services/              # Signal-based services
│       │   ├── chat.service.ts    # Chat com SSE streaming
│       │   ├── session.service.ts # Gerenciamento de sessões
│       │   ├── rag.service.ts     # Busca RAG
│       │   └── config.service.ts  # Configuração
│       ├── components/
│       │   └── chat/
│       │       └── chat.component.ts  # Componente completo
│       └── models/                # TypeScript interfaces
│           ├── chat.models.ts
│           ├── session.models.ts
│           ├── rag.models.ts
│           └── config.models.ts
└── src/                           # Demo Application
    └── app/
        └── app.component.ts
```

## 🎯 Padrões do Angular AI Implementados

### 1. Signals para Estado Reativo
```typescript
// ChatService usa signals nativos do Angular
messages = signal<ChatMessage[]>([]);
isStreaming = signal(false);
error = signal<string | null>(null);
```

### 2. SSE Streaming Nativo
```typescript
// Fetch API com ReadableStream para streaming
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Atualiza signal incrementalmente
  messages.update(msgs => [...msgs, newChunk]);
}
```

### 3. Loading States no Template
```html
@if (chat.isStreaming()) {
  <div class="loading">Claude está pensando...</div>
}
@if (chat.error()) {
  <div class="error">{{ chat.error() }}</div>
}
```

## 🚀 Uso

### Instalação Local (Dev)
```bash
cd claude_front_sdk_angular
npm install
npm start  # Abre http://localhost:4200
```

### Build da Library
```bash
npm run build:lib
# Output: dist/claude-front-sdk/
```

### Publicar no NPM
```bash
cd dist/claude-front-sdk
npm publish
```

## 🔧 Configuração

### Environments (Recomendado)
```typescript
// src/environments/environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001',
  apiKey: '',
  defaultModel: 'haiku' as const,
  streaming: true,
};

// src/environments/environment.prod.ts (prod)
export const environment = {
  production: true,
  apiUrl: '/api',  // Proxy reverso
  apiKey: '',      // Gerenciado via backend
  ...
};

// main.ts
import { environment } from './environments/environment';
import { provideClaude } from 'claude-front-sdk-angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideClaude({
      apiUrl: environment.apiUrl,
      apiKey: environment.apiKey || undefined,
      streaming: environment.streaming,
      defaultModel: environment.defaultModel,
    })
  ]
});
```

## 📡 Integração Backend

### Endpoints Consumidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/chat/stream` | POST | Chat com streaming SSE |
| `/sessions` | GET | Listar sessões |
| `/session/current` | GET | Sessão atual |
| `/reset` | POST | Nova sessão |
| `/sessions/:id` | DELETE | Deletar sessão |
| `/rag/search` | POST | Busca semântica |

### Formato SSE
```
data: {"text": "Olá"}
data: {"text": "! Como"}
data: {"text": " posso"}
data: {"text": " ajudar?"}
data: [DONE]
```

## ✅ Features Implementadas

- [x] **ChatService** com Signals e SSE streaming
- [x] **SessionService** para gerenciar sessões
- [x] **RAGService** para busca semântica
- [x] **ChatComponent** standalone com UI completa
- [x] **ConfigService** com dependency injection
- [x] **TypeScript** tipos completos matching backend
- [x] **Loading states** (isStreaming, error)
- [x] **Demo app** funcional
- [x] **CORS** configurado (localhost:4200)
- [x] **Autenticação** via X-API-Key header

## 🎨 Componente Pronto

```typescript
import { ChatComponent } from 'claude-front-sdk-angular';

@Component({
  imports: [ChatComponent],
  template: '<claude-chat />'
})
export class AppComponent {}
```

## 🔥 Próximas Features (Roadmap)

- [ ] linkedSignal para acumular histórico
- [ ] Material Design components
- [ ] Markdown rendering
- [ ] Code syntax highlighting
- [ ] Session selector component
- [ ] RAG search component
- [ ] Upload de documentos UI
- [ ] Testes unitários (Jasmine/Karma)
- [ ] E2E tests (Playwright)
- [ ] Storybook para components

## 📊 Performance

- Initial bundle: ~342kB (com lazy loading)
- main.js: ~29kB
- First load: <1s
- Streaming latency: <100ms
- Memory: Eficiente com Signals (sem zone.js overhead se zoneless)
- Budget: 350kB warning, 500kB error

## 🛠️ Desenvolvimento

```bash
# Watch mode (recompila automaticamente)
npm run watch

# Testes
npm test

# Lint + Formatação
npm run lint          # ESLint
npm run lint:fix      # ESLint com auto-fix
npm run format        # Prettier
npm run format:check  # Verificar formatação

# Pre-commit (via Husky + lint-staged)
# Roda automaticamente: prettier --write + eslint --fix
```

## 📝 Licença

MIT
