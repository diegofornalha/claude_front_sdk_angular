# Claude Front SDK Angular

Angular SDK profissional para integração com Claude RAG Backend.

## 🚀 Instalação

```bash
npm install claude-front-sdk-angular
```

## 📖 Uso Básico

### 1. Configuração

```typescript
// app.config.ts
import { provideClaude } from 'claude-front-sdk-angular';

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideClaude({
      apiUrl: 'http://localhost:8001',
      streaming: true,
      defaultModel: 'haiku'
    })
  ]
};
```

### 2. Componente Pronto

```typescript
import { ChatComponent } from 'claude-front-sdk-angular';

@Component({
  imports: [ChatComponent],
  template: '<claude-chat />'
})
export class AppComponent {}
```

### 3. Uso Avançado

```typescript
import { ChatService } from 'claude-front-sdk-angular';

export class MyComponent {
  chat = inject(ChatService);

  ngOnInit() {
    // Enviar mensagem
    this.chat.input.set('Olá Claude!');
    this.chat.send();

    // Acessar histórico
    console.log(this.chat.messages());
  }
}
```

## 🎯 Features

- ✅ **Signals API** - Estado reativo
- ✅ **SSE Streaming** - Respostas incrementais
- ✅ **Session Management** - Gerenciamento de sessões
- ✅ **RAG Search** - Busca semântica
- ✅ **TypeScript** - Totalmente tipado
- ✅ **Standalone Components** - Angular moderno

## 🔧 Development

```bash
# Instalar dependências
npm install

# Rodar demo app
npm start

# Build library
npm run build:lib
```

## 📝 Licença

MIT
