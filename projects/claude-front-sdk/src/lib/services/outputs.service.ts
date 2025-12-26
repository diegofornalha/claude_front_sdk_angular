import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * Interface para arquivo de output
 */
export interface OutputFile {
  name: string;
  size: number;
  modified: number;
  path?: string;
  session_id?: string;
}

/**
 * Resposta da listagem de outputs
 */
export interface OutputsResponse {
  files: OutputFile[];
  directory: string;
  count: number;
  session_id?: string;
  error?: string;
}

/**
 * Resposta de leitura de arquivo
 */
export interface FileContentResponse {
  filename: string;
  content: string;
  session_id?: string;
}

/**
 * OutputsService - Gerencia arquivos de output/artefatos
 */
@Injectable({
  providedIn: 'root'
})
export class OutputsService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  files = signal<OutputFile[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  /**
   * Lista arquivos de output
   * @param sessionId - ID da sessão (opcional, lista todos se não fornecido)
   */
  async list(sessionId?: string): Promise<OutputFile[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      let url = `${this.config.apiUrl}/outputs?directory=outputs`;
      if (sessionId) {
        url += `&session_id=${sessionId}`;
      }

      const response = await firstValueFrom(
        this.http.get<OutputsResponse>(url)
      );

      const files = response.files || [];
      this.files.set(files);
      return files;
    } catch (err) {
      console.error('[OutputsService] Erro ao listar outputs:', err);
      this.error.set('Erro ao carregar arquivos');
      this.files.set([]);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Lê conteúdo de um arquivo
   * @param filename - Nome do arquivo
   */
  async readFile(filename: string): Promise<string | null> {
    try {
      const url = `${this.config.apiUrl}/outputs/file/${filename}`;
      const response = await firstValueFrom(
        this.http.get<FileContentResponse>(url)
      );
      return response.content;
    } catch (err) {
      console.error('[OutputsService] Erro ao ler arquivo:', err);
      return null;
    }
  }

  /**
   * Retorna URL para abrir/baixar arquivo
   * @param file - Arquivo ou nome do arquivo
   * @param sessionId - ID da sessão (opcional)
   */
  getFileUrl(file: OutputFile | string, sessionId?: string): string {
    const filename = typeof file === 'string' ? file : file.name;
    const path = sessionId ? `${sessionId}/${filename}` : filename;
    return `${this.config.apiUrl}/outputs/file/${path}`;
  }

  /**
   * Retorna URL para visualizar arquivo HTML
   * @param file - Arquivo ou nome do arquivo
   * @param sessionId - ID da sessão
   */
  getViewerUrl(file: OutputFile | string, sessionId: string): string {
    const filename = typeof file === 'string' ? file : file.name;
    // Usa o servidor estático em :3000 para servir arquivos HTML
    return `http://localhost:3000/backend/outputs/${sessionId}/${filename}`;
  }

  /**
   * Deleta um arquivo
   * @param filename - Nome do arquivo
   */
  async delete(filename: string): Promise<boolean> {
    try {
      const url = `${this.config.apiUrl}/outputs/${filename}`;
      await firstValueFrom(this.http.delete(url));
      // Recarrega a lista
      await this.list();
      return true;
    } catch (err) {
      console.error('[OutputsService] Erro ao deletar arquivo:', err);
      return false;
    }
  }

  /**
   * Escreve um arquivo
   * @param filename - Nome do arquivo
   * @param content - Conteúdo
   */
  async writeFile(filename: string, content: string): Promise<boolean> {
    try {
      const url = `${this.config.apiUrl}/outputs/write`;
      await firstValueFrom(
        this.http.post(url, null, {
          params: { filename, content, directory: '/outputs' }
        })
      );
      return true;
    } catch (err) {
      console.error('[OutputsService] Erro ao escrever arquivo:', err);
      return false;
    }
  }

  /**
   * Formata tamanho do arquivo
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Formata data de modificação
   */
  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retorna ícone baseado na extensão
   */
  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
      'txt': '📄', 'md': '📝', 'py': '🐍', 'js': '📜', 'ts': '📘',
      'json': '📋', 'html': '🌐', 'css': '🎨', 'png': '🖼️',
      'jpg': '🖼️', 'jpeg': '🖼️', 'pdf': '📕', 'csv': '📊',
      'xml': '📰', 'yaml': '⚙️', 'yml': '⚙️'
    };
    return icons[ext] || '📄';
  }

  /**
   * Verifica se é um arquivo visualizável no browser
   */
  isViewable(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['html', 'htm', 'txt', 'md', 'json', 'xml', 'csv'].includes(ext);
  }
}
