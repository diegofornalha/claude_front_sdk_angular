import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ToolCallsService } from './toolcalls.service';
import { ConfigService, CLAUDE_CONFIG } from './config.service';

describe('ToolCallsService', () => {
  let service: ToolCallsService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://test-api.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ToolCallsService,
        ConfigService,
        { provide: CLAUDE_CONFIG, useValue: { apiUrl } }
      ]
    });
    service = TestBed.inject(ToolCallsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopPolling();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty recentToolCalls', () => {
      expect(service.recentToolCalls()).toEqual([]);
    });

    it('should not be polling', () => {
      expect(service.isPolling()).toBeFalse();
    });

    it('should have null stats', () => {
      expect(service.stats()).toBeNull();
    });

    it('should have null debug', () => {
      expect(service.debug()).toBeNull();
    });
  });

  describe('setSessionId', () => {
    it('should set session ID for filtering', fakeAsync(() => {
      service.setSessionId('session-123');
      service.getRecent(10);

      const req = httpMock.expectOne(
        req => req.url.includes('/audit/tools') && req.url.includes('session_id=session-123')
      );
      req.flush({ recent: [] });
      tick();
    }));
  });

  describe('getRecent', () => {
    it('should fetch recent tool calls', fakeAsync(() => {
      const mockToolCalls = [
        { id: '1', tool_name: 'search', status: 'success' },
        { id: '2', tool_name: 'read', status: 'success' }
      ];

      service.getRecent(5).then(result => {
        expect(result).toEqual(mockToolCalls);
        expect(service.recentToolCalls()).toEqual(mockToolCalls);
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/tools?limit=5`);
      expect(req.request.method).toBe('GET');
      req.flush({ recent: mockToolCalls });
      tick();
    }));

    it('should use default limit of 10', fakeAsync(() => {
      service.getRecent();

      const req = httpMock.expectOne(`${apiUrl}/audit/tools?limit=10`);
      req.flush({ recent: [] });
      tick();
    }));

    it('should handle tool_calls response format', fakeAsync(() => {
      const mockToolCalls = [{ id: '1', tool_name: 'test' }];

      service.getRecent().then(result => {
        expect(result).toEqual(mockToolCalls);
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/tools?limit=10`);
      req.flush({ tool_calls: mockToolCalls });
      tick();
    }));
  });

  describe('getStats', () => {
    it('should fetch and update stats', fakeAsync(() => {
      const mockStats = {
        session_id: 'session-123',
        total_calls: 100,
        errors: 5,
        avg_duration_ms: 150,
        by_tool: { search: 50, read: 50 }
      };

      service.getStats().then(result => {
        expect(result).toEqual(mockStats);
        expect(service.stats()).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
      tick();
    }));

    it('should return null on error', fakeAsync(() => {
      spyOn(console, 'error');

      service.getStats().then(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/stats`);
      req.error(new ErrorEvent('Network error'));
      tick();
    }));
  });

  describe('getDebug', () => {
    it('should fetch debug info for session', fakeAsync(() => {
      const mockDebug = {
        found: true,
        count: 2,
        session_id: 'session-123',
        summary: { total_events: 10, tool_events: 5, file_writes: 3, streams: 2 },
        entries: []
      };

      service.getDebug('session-123').then(result => {
        expect(result).toEqual(mockDebug);
        expect(service.debug()).toEqual(mockDebug);
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/debug/session-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDebug);
      tick();
    }));

    it('should return null on error', fakeAsync(() => {
      spyOn(console, 'error');

      service.getDebug('session-123').then(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/audit/debug/session-123`);
      req.error(new ErrorEvent('Network error'));
      tick();
    }));
  });

  describe('startPolling', () => {
    it('should set isPolling to true', () => {
      service.startPolling(1000);
      expect(service.isPolling()).toBeTrue();
    });

    it('should make initial requests immediately', fakeAsync(() => {
      service.startPolling(5000);

      // Initial requests
      const toolsReq = httpMock.expectOne(`${apiUrl}/audit/tools?limit=10`);
      toolsReq.flush({ recent: [] });

      const statsReq = httpMock.expectOne(`${apiUrl}/audit/stats`);
      statsReq.flush({});

      tick();
      discardPeriodicTasks();
    }));

    it('should not start if already polling', fakeAsync(() => {
      service.startPolling(1000);
      service.startPolling(1000); // Second call should be ignored

      const toolsReq = httpMock.expectOne(`${apiUrl}/audit/tools?limit=10`);
      toolsReq.flush({ recent: [] });

      const statsReq = httpMock.expectOne(`${apiUrl}/audit/stats`);
      statsReq.flush({});

      tick();
      discardPeriodicTasks();
    }));
  });

  describe('stopPolling', () => {
    it('should set isPolling to false', fakeAsync(() => {
      service.startPolling(1000);

      const toolsReq = httpMock.expectOne(`${apiUrl}/audit/tools?limit=10`);
      toolsReq.flush({ recent: [] });

      const statsReq = httpMock.expectOne(`${apiUrl}/audit/stats`);
      statsReq.flush({});

      service.stopPolling();
      expect(service.isPolling()).toBeFalse();

      tick();
      discardPeriodicTasks();
    }));
  });

  describe('clear', () => {
    it('should reset all signals', () => {
      service.recentToolCalls.set([{ id: '1' } as any]);
      service.stats.set({ total_calls: 10 } as any);
      service.debug.set({ session_id: 'test' } as any);

      service.clear();

      expect(service.recentToolCalls()).toEqual([]);
      expect(service.stats()).toBeNull();
      expect(service.debug()).toBeNull();
    });
  });
});
