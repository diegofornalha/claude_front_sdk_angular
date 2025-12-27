import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { ToolCallsPanelComponent } from './toolcalls-panel.component';
import { ToolCallsService } from '../../services/toolcalls.service';
import { ChatService } from '../../services/chat.service';
import { ConfigService } from '../../services/config.service';

// Mock services
const mockToolCallsService = {
  recentToolCalls: signal([]),
  stats: signal({
    total_calls: 0,
    errors: 0,
    avg_duration_ms: 0,
    by_tool: {},
  }),
  setSessionId: () => {},
  getRecent: () => {},
  getStats: () => {},
  startPolling: () => {},
  stopPolling: () => {},
};

const mockToolCallsServiceWithData = {
  recentToolCalls: signal([
    {
      id: 1,
      name: 'rag_search',
      status: 'success' as const,
      started_at: Date.now() / 1000 - 60,
      duration_ms: 245,
      parameters: { query: 'Como usar o SDK?' },
    },
    {
      id: 2,
      name: 'file_write',
      status: 'success' as const,
      started_at: Date.now() / 1000 - 30,
      duration_ms: 12,
      parameters: { path: '/outputs/response.md' },
    },
    {
      id: 3,
      name: 'rag_search',
      status: 'running' as const,
      started_at: Date.now() / 1000,
      duration_ms: 0,
      parameters: { query: 'Arquitetura do sistema' },
    },
  ]),
  stats: signal({
    total_calls: 15,
    errors: 1,
    avg_duration_ms: 156,
    by_tool: {
      rag_search: 8,
      file_write: 4,
      code_analysis: 2,
      summarize: 1,
    },
  }),
  setSessionId: () => {},
  getRecent: () => {},
  getStats: () => {},
  startPolling: () => {},
  stopPolling: () => {},
};

const mockChatService = {
  isStreaming: signal(false),
};

const mockChatServiceStreaming = {
  isStreaming: signal(true),
};

const mockConfigService = {
  apiUrl: 'http://localhost:8001',
};

const meta: Meta<ToolCallsPanelComponent> = {
  title: 'Components/ToolCallsPanel',
  component: ToolCallsPanelComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: ToolCallsService, useValue: mockToolCallsService },
        { provide: ChatService, useValue: mockChatService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Se o painel está aberto',
    },
    sessionId: {
      control: 'text',
      description: 'ID da sessão atual',
    },
  },
};

export default meta;
type Story = StoryObj<ToolCallsPanelComponent>;

export const Empty: Story = {
  name: 'Estado Vazio',
  args: {
    isOpen: true,
    sessionId: 'session-123',
  },
};

export const WithToolCalls: Story = {
  name: 'Com Tool Calls',
  args: {
    isOpen: true,
    sessionId: 'session-123',
  },
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ToolCallsService, useValue: mockToolCallsServiceWithData },
        { provide: ChatService, useValue: mockChatService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const Streaming: Story = {
  name: 'Durante Streaming',
  args: {
    isOpen: true,
    sessionId: 'session-456',
  },
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ToolCallsService, useValue: mockToolCallsServiceWithData },
        { provide: ChatService, useValue: mockChatServiceStreaming },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const WithErrors: Story = {
  name: 'Com Erros',
  args: {
    isOpen: true,
    sessionId: 'session-789',
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ToolCallsService,
          useValue: {
            ...mockToolCallsServiceWithData,
            recentToolCalls: signal([
              {
                id: 1,
                name: 'external_api',
                status: 'error' as const,
                started_at: Date.now() / 1000 - 120,
                duration_ms: 5000,
                parameters: { endpoint: '/api/users' },
                error_message: 'Connection timeout after 5000ms',
              },
              {
                id: 2,
                name: 'rag_search',
                status: 'success' as const,
                started_at: Date.now() / 1000 - 60,
                duration_ms: 180,
                parameters: { query: 'test' },
              },
            ]),
            stats: signal({
              total_calls: 5,
              errors: 2,
              avg_duration_ms: 1200,
              by_tool: { external_api: 2, rag_search: 3 },
            }),
          },
        },
        { provide: ChatService, useValue: mockChatService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};
