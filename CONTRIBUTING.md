# Guia de Contribuição

Obrigado pelo interesse em contribuir com o Claude Front SDK Angular!

## Configuração do Ambiente

### Pré-requisitos

- Node.js >= 18
- npm >= 9

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/claude-front-sdk-angular.git
cd claude-front-sdk-angular

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

## Comandos Disponíveis

```bash
# Desenvolvimento
npm start              # Inicia servidor em http://localhost:4200
npm run watch          # Build em modo watch

# Build
npm run build          # Build de produção da demo app
npm run build:lib      # Build da library

# Testes
npm test               # Testes da demo app
npm run test:lib       # Testes da library
npm run test:lib:ci    # Testes em CI (headless)
npm run test:coverage  # Testes com cobertura

# Qualidade de Código
npm run lint           # ESLint
npm run lint:fix       # ESLint com auto-fix
npm run format         # Prettier
npm run format:check   # Verificar formatação
```

## Estrutura do Projeto

```
claude_front_sdk_angular/
├── projects/claude-front-sdk/    # SDK Library (publicável)
│   └── src/lib/
│       ├── services/             # Serviços com Signals
│       ├── components/           # Componentes standalone
│       ├── models/               # Interfaces TypeScript
│       └── pipes/                # Pipes
├── src/                          # Demo Application
│   ├── app/
│   │   ├── components/           # Componentes da demo
│   │   └── pages/                # Páginas lazy-loaded
│   └── environments/             # Configurações de ambiente
└── .husky/                       # Git hooks
```

## Padrões de Código

### Angular

- Usar **Signals** para estado reativo (não RxJS para estado local)
- Componentes devem ser **standalone**
- Usar **ChangeDetectionStrategy.OnPush**
- Nomes de arquivos: `nome.component.ts`, `nome.service.ts`

### TypeScript

- Type hints em todas as funções públicas
- Evitar `any` - usar tipos concretos ou generics
- Interfaces devem ter prefixo descritivo (não `I`)

### Estilos

- Prettier formata automaticamente no commit
- Configuração em `.prettierrc.json`

## Commits

O pre-commit hook executa automaticamente:
1. `prettier --write` nos arquivos staged
2. `eslint --fix` nos arquivos staged

Se o lint falhar, o commit será bloqueado.

### Convenção de Commits

```
feat(chat): adicionar suporte a citações
fix(session): corrigir reload duplicado
docs: atualizar README
test(chat): adicionar testes do ChatService
refactor(services): extrair lógica comum
```

## Criando Componentes

```bash
# Gerar componente na library
ng generate component components/meu-componente --project=claude-front-sdk

# Gerar serviço
ng generate service services/meu-servico --project=claude-front-sdk
```

### Exemplo de Componente com Signals

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'claude-my-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <div>Carregando...</div>
    } @else {
      <div>{{ data() }}</div>
    }
  `
})
export class MyComponent {
  private chat = inject(ChatService);

  isLoading = signal(false);
  data = computed(() => this.chat.messages().length);
}
```

## Testes

Usamos **Jasmine** + **Karma**:

```typescript
describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatService]
    });
    service = TestBed.inject(ChatService);
  });

  it('should initialize with empty messages', () => {
    expect(service.messages()).toEqual([]);
  });
});
```

## Publicando a Library

```bash
# Build
npm run build:lib

# Publicar (requer acesso ao npm)
cd dist/claude-front-sdk
npm publish
```

## Perguntas?

Abra uma issue com a tag `question`.
