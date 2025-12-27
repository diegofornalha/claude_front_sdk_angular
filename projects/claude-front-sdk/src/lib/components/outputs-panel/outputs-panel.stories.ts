import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { OutputsPanelComponent } from './outputs-panel.component';
import { OutputsService, OutputFile } from '../../services/outputs.service';
import { ConfigService } from '../../services/config.service';

// Mock OutputsService
const mockOutputsService = {
  files: signal<OutputFile[]>([]),
  isLoading: signal(false),
  error: signal(null),
  loadFiles: () => {},
  deleteFile: () => Promise.resolve(),
  getFileIcon: (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📄',
      md: '📝',
      txt: '📃',
      json: '📋',
      py: '🐍',
      ts: '💙',
      js: '💛',
    };
    return icons[ext || ''] || '📁';
  },
  formatSize: (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
  formatDate: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
  isViewable: (name: string) => ['pdf', 'md', 'txt', 'json'].includes(name.split('.').pop() || ''),
};

const mockOutputsServiceWithFiles = {
  ...mockOutputsService,
  files: signal<OutputFile[]>([
    { name: 'relatorio.pdf', size: 256000, modified: '2025-12-27T10:30:00Z' },
    { name: 'dados.json', size: 4200, modified: '2025-12-27T11:15:00Z' },
    { name: 'resumo.md', size: 1800, modified: '2025-12-27T12:00:00Z' },
    { name: 'script.py', size: 3400, modified: '2025-12-27T14:20:00Z' },
  ]),
};

const mockConfigService = {
  apiUrl: 'http://localhost:8001',
};

const meta: Meta<OutputsPanelComponent> = {
  title: 'Components/OutputsPanel',
  component: OutputsPanelComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: OutputsService, useValue: mockOutputsService },
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
type Story = StoryObj<OutputsPanelComponent>;

export const Empty: Story = {
  name: 'Estado Vazio',
  args: {
    isOpen: true,
    sessionId: 'session-123',
  },
};

export const WithFiles: Story = {
  name: 'Com Arquivos',
  args: {
    isOpen: true,
    sessionId: 'session-123',
  },
  decorators: [
    moduleMetadata({
      providers: [
        { provide: OutputsService, useValue: mockOutputsServiceWithFiles },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const Loading: Story = {
  name: 'Carregando',
  args: {
    isOpen: true,
    sessionId: 'session-123',
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: OutputsService,
          useValue: {
            ...mockOutputsService,
            isLoading: signal(true),
          },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }),
  ],
};

export const Closed: Story = {
  name: 'Fechado',
  args: {
    isOpen: false,
    sessionId: 'session-123',
  },
};
