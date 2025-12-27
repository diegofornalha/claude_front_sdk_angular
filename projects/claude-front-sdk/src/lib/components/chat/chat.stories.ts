import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { ConfigService } from '../../services/config.service';

// Mock ChatService
const mockChatService = {
  messages: signal([]),
  isStreaming: signal(false),
  error: signal(null),
  input: signal(''),
  send: () => {},
  setModel: () => {},
};

const mockChatServiceWithMessages = {
  messages: signal([
    { id: 1, role: 'user', content: 'Como funciona o RAG?' },
    {
      id: 2,
      role: 'assistant',
      content: `**RAG (Retrieval-Augmented Generation)** combina recuperação de informação com geração de texto.

## Como funciona:
1. **Busca**: Encontra documentos relevantes na base de conhecimento
2. **Contexto**: Adiciona os documentos ao prompt
3. **Geração**: O LLM gera resposta usando o contexto

### Vantagens:
- Respostas mais precisas
- Menos alucinações
- Conhecimento atualizado`,
    },
  ]),
  isStreaming: signal(false),
  error: signal(null),
  input: signal(''),
  send: () => {},
  setModel: () => {},
};

const mockChatServiceStreaming = {
  messages: signal([
    { id: 1, role: 'user', content: 'Explique machine learning' },
    { id: 2, role: 'assistant', content: 'Machine learning é uma área da IA que...' },
  ]),
  isStreaming: signal(true),
  error: signal(null),
  input: signal(''),
  send: () => {},
  setModel: () => {},
};

const mockConfigService = {
  apiUrl: 'http://localhost:8001',
  streaming: true,
  defaultModel: 'haiku',
};

const meta: Meta<ChatComponent> = {
  title: 'Components/Chat',
  component: ChatComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'claude',
      values: [{ name: 'claude', value: '#faf9f5' }],
    },
  },
};

export default meta;
type Story = StoryObj<ChatComponent>;

export const Empty: Story = {
  name: 'Estado Inicial (Vazio)',
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const WithMessages: Story = {
  name: 'Com Mensagens',
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ChatService, useValue: mockChatServiceWithMessages },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const Streaming: Story = {
  name: 'Em Streaming',
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ChatService, useValue: mockChatServiceStreaming },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const WithError: Story = {
  name: 'Com Erro',
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ChatService,
          useValue: {
            ...mockChatService,
            messages: signal([{ id: 1, role: 'user', content: 'Teste' }]),
            error: signal('Erro de conexão com o servidor'),
          },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};
