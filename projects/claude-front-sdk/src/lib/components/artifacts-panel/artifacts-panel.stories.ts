import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { ArtifactsPanelComponent, Artifact } from './artifacts-panel.component';

const meta: Meta<ArtifactsPanelComponent> = {
  title: 'Components/ArtifactsPanel',
  component: ArtifactsPanelComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
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
    artifacts: {
      control: 'object',
      description: 'Lista de artefatos',
    },
  },
};

export default meta;
type Story = StoryObj<ArtifactsPanelComponent>;

export const Empty: Story = {
  name: 'Estado Vazio',
  args: {
    isOpen: true,
    artifacts: [],
  },
};

export const WithArtifacts: Story = {
  name: 'Com Artefatos',
  args: {
    isOpen: true,
    artifacts: [
      {
        id: '1',
        title: 'Componente React',
        type: 'react',
        content: `function Button({ children }) {
  return <button className="btn">{children}</button>;
}`,
        language: 'jsx',
        createdAt: new Date('2025-12-27T10:30:00Z'),
      },
      {
        id: '2',
        title: 'Diagrama SVG',
        type: 'svg',
        content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
        createdAt: new Date('2025-12-27T11:00:00Z'),
      },
      {
        id: '3',
        title: 'Script Python',
        type: 'code',
        content: `def hello():
    print("Hello, World!")

if __name__ == "__main__":
    hello()`,
        language: 'python',
        createdAt: new Date('2025-12-27T12:00:00Z'),
      },
      {
        id: '4',
        title: 'Preview HTML',
        type: 'html',
        content: '<div class="card"><h2>Título</h2><p>Conteúdo aqui</p></div>',
        createdAt: new Date('2025-12-27T13:00:00Z'),
      },
    ] as Artifact[],
  },
};

export const WithCodeArtifact: Story = {
  name: 'Artefato de Código',
  args: {
    isOpen: true,
    artifacts: [
      {
        id: '1',
        title: 'Algoritmo de Ordenação',
        type: 'code',
        content: `function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}`,
        language: 'typescript',
        createdAt: new Date(),
      },
    ] as Artifact[],
  },
};

export const WithImageArtifact: Story = {
  name: 'Artefato de Imagem',
  args: {
    isOpen: true,
    artifacts: [
      {
        id: '1',
        title: 'Gráfico de Vendas',
        type: 'image',
        content: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect fill="%23da7756" x="10" y="50" width="30" height="50"/><rect fill="%23da7756" x="50" y="30" width="30" height="70"/><rect fill="%23da7756" x="90" y="10" width="30" height="90"/></svg>',
        createdAt: new Date(),
      },
    ] as Artifact[],
  },
};

export const Closed: Story = {
  name: 'Fechado',
  args: {
    isOpen: false,
    artifacts: [],
  },
};
