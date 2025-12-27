import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { ConfigService, CLAUDE_CONFIG } from './config.service';
import { SessionService } from './session.service';

describe('ChatService', () => {
  let service: ChatService;
  let sessionService: SessionService;
  const apiUrl = 'http://test-api.com';

  // Mock fetch for SSE streaming
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatService,
        ConfigService,
        SessionService,
        { provide: CLAUDE_CONFIG, useValue: { apiUrl, apiKey: 'test-key' } }
      ]
    });
    service = TestBed.inject(ChatService);
    sessionService = TestBed.inject(SessionService);

    // Setup fetch mock
    fetchSpy = spyOn(window, 'fetch');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty messages', () => {
      expect(service.messages()).toEqual([]);
    });

    it('should have empty input', () => {
      expect(service.input()).toBe('');
    });

    it('should not be streaming', () => {
      expect(service.isStreaming()).toBeFalse();
    });

    it('should have no error', () => {
      expect(service.error()).toBeNull();
    });

    it('should have null currentSessionId', () => {
      expect(service.currentSessionId()).toBeNull();
    });

    it('should have default model as opus', () => {
      expect(service.currentModel()).toBe('opus');
    });
  });

  describe('input signal', () => {
    it('should update input value', () => {
      service.input.set('Hello Claude');
      expect(service.input()).toBe('Hello Claude');
    });
  });

  describe('clear', () => {
    it('should clear messages and error', () => {
      // Setup some state
      service.messages.set([
        { id: '1', role: 'user', content: 'test', timestamp: Date.now() }
      ]);
      service.error.set('Some error');

      service.clear();

      expect(service.messages()).toEqual([]);
      expect(service.error()).toBeNull();
    });
  });

  describe('removeLastMessage', () => {
    it('should remove the last message', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'First', timestamp: Date.now() },
        { id: '2', role: 'assistant' as const, content: 'Second', timestamp: Date.now() }
      ];
      service.messages.set(messages);

      service.removeLastMessage();

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].id).toBe('1');
    });

    it('should handle empty messages', () => {
      service.messages.set([]);
      service.removeLastMessage();
      expect(service.messages()).toEqual([]);
    });
  });

  describe('setSession', () => {
    it('should set currentSessionId', () => {
      service.setSession('new-session-123');
      expect(service.currentSessionId()).toBe('new-session-123');
    });

    it('should allow null to clear session', () => {
      service.setSession('session-1');
      service.setSession(null);
      expect(service.currentSessionId()).toBeNull();
    });
  });

  describe('setModel', () => {
    it('should set model to haiku', () => {
      service.setModel('haiku');
      expect(service.currentModel()).toBe('haiku');
    });

    it('should set model to sonnet', () => {
      service.setModel('sonnet');
      expect(service.currentModel()).toBe('sonnet');
    });

    it('should set model to opus', () => {
      service.setModel('opus');
      expect(service.currentModel()).toBe('opus');
    });
  });

  describe('chatHistory computed', () => {
    it('should return formatted chat history', () => {
      service.messages.set([
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
      ]);

      const history = service.chatHistory();

      expect(history).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]);
    });
  });

  describe('send', () => {
    it('should not send if input is empty', async () => {
      service.input.set('   ');
      await service.send();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not send if already streaming', async () => {
      service.input.set('Hello');
      service.isStreaming.set(true);
      await service.send();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should add user message before sending', fakeAsync(() => {
      const userMessage = 'Hello Claude';
      service.input.set(userMessage);

      // Mock successful streaming response
      const mockResponse = createMockStreamResponse([
        { text: 'Hi' },
        { text: ' there!' },
        '[DONE]'
      ]);
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      service.send();
      tick();

      // Check user message was added
      const messages = service.messages();
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe(userMessage);

      flush();
    }));

    it('should clear input after sending', fakeAsync(() => {
      service.input.set('Hello');

      const mockResponse = createMockStreamResponse(['[DONE]']);
      fetchSpy.and.returnValue(Promise.resolve(mockResponse));

      service.send();
      tick();

      expect(service.input()).toBe('');

      flush();
    }));

    it('should set error on fetch failure', fakeAsync(() => {
      service.input.set('Hello');
      fetchSpy.and.returnValue(Promise.reject(new Error('Network error')));

      service.send();
      tick();

      expect(service.error()).toBe('Network error');
      expect(service.isStreaming()).toBeFalse();

      flush();
    }));
  });

  describe('loadSession', () => {
    it('should not reload if streaming is active', async () => {
      service.isStreaming.set(true);
      await service.loadSession('session-123');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should set currentSessionId', fakeAsync(() => {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ messages: [] })
      }));

      service.loadSession('new-session');
      tick();

      expect(service.currentSessionId()).toBe('new-session');

      flush();
    }));

    it('should handle 404 gracefully', fakeAsync(() => {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      service.loadSession('missing-session');
      tick();

      expect(service.messages()).toEqual([]);
      expect(service.error()).toBeNull();

      flush();
    }));
  });
});

// Helper function to create mock SSE stream response
function createMockStreamResponse(chunks: (string | { text?: string; session_id?: string })[]) {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }

      const chunk = chunks[index++];
      let data: string;

      if (typeof chunk === 'string') {
        data = chunk === '[DONE]' ? 'data: [DONE]\n\n' : `data: ${chunk}\n\n`;
      } else {
        data = `data: ${JSON.stringify(chunk)}\n\n`;
      }

      controller.enqueue(encoder.encode(data));
    }
  });

  return {
    ok: true,
    status: 200,
    body: stream
  };
}
