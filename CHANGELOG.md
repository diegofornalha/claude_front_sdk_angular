# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- Sistema de environments (`environment.ts`, `environment.prod.ts`)
- Prettier configurado com parser Angular
- Husky + lint-staged para pre-commit hooks
- LoggerService para centralizar logs
- Scripts de formatação (`npm run format`, `npm run format:check`)

### Alterado
- Bundle size otimizado de 412kB para 342kB (-17%)
- Budget de build ajustado para 350kB warning, 500kB error
- Removidas dependências não utilizadas (Angular Material, CDK)
- URLs de API agora vêm do environment

### Corrigido
- URLs hardcoded removidas do bundle de produção

## [0.1.0] - 2025-12-27

### Adicionado
- SDK Angular com Signals para estado reativo
- ChatService com SSE streaming
- SessionService para gerenciamento de sessões
- RAGService para busca semântica
- ToolCallsService para monitoramento de tool calls
- OutputsService para arquivos gerados
- ChatComponent standalone com UI completa
- ToolCallsPanelComponent para visualização de ferramentas
- OutputsPanelComponent para visualização de arquivos
- MarkdownPipe para renderização de markdown
- Sistema de configuração via `provideClaude()`
- Lazy loading para todas as páginas
- Demo app funcional com sidebar navegável

### Dependências
- Angular 18.2.0
- RxJS 7.8.0
- TypeScript 5.5.2
