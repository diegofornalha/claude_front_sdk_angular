import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { ConfigService, CLAUDE_CONFIG } from './config.service';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://test-api.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SessionService,
        ConfigService,
        { provide: CLAUDE_CONFIG, useValue: { apiUrl } }
      ]
    });
    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null currentSession', () => {
      expect(service.currentSession()).toBeNull();
    });

    it('should have empty sessions array', () => {
      expect(service.sessions()).toEqual([]);
    });

    it('should have isLoading false', () => {
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('getCurrent', () => {
    it('should fetch current session and update signal', fakeAsync(() => {
      const mockSession = {
        session_id: 'test-123',
        active: true,
        message_count: 5
      };

      service.getCurrent().then(result => {
        expect(result).toEqual(mockSession);
        expect(service.currentSession()).toEqual(mockSession);
      });

      const req = httpMock.expectOne(`${apiUrl}/session/current`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSession);
      tick();
    }));
  });

  describe('list', () => {
    it('should fetch sessions and update signal', fakeAsync(() => {
      const mockSessions = [
        { session_id: '1', title: 'Session 1', message_count: 3 },
        { session_id: '2', title: 'Session 2', message_count: 5 }
      ];

      service.list().then(result => {
        expect(result).toEqual(mockSessions);
        expect(service.sessions()).toEqual(mockSessions);
      });

      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      expect(req.request.method).toBe('GET');
      req.flush({ sessions: mockSessions });
      tick();
    }));

    it('should set isLoading true while fetching', fakeAsync(() => {
      service.list();

      expect(service.isLoading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      req.flush({ sessions: [] });
      tick();

      expect(service.isLoading()).toBeFalse();
    }));

    it('should set isLoading false on error', fakeAsync(() => {
      service.list().catch(() => {});

      const req = httpMock.expectOne(`${apiUrl}/sessions`);
      req.error(new ErrorEvent('Network error'));
      tick();

      expect(service.isLoading()).toBeFalse();
    }));
  });

  describe('delete', () => {
    it('should send DELETE request', fakeAsync(() => {
      const sessionId = 'session-to-delete';

      // Setup initial sessions
      service.sessions.set([{ session_id: sessionId } as any]);

      service.delete(sessionId);

      const deleteReq = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({});

      // Expects list refresh
      const listReq = httpMock.expectOne(`${apiUrl}/sessions`);
      listReq.flush({ sessions: [] });
      tick();
    }));

    it('should skip refresh when skipRefresh is true', fakeAsync(() => {
      const sessionId = 'session-to-delete';

      service.delete(sessionId, true);

      const deleteReq = httpMock.expectOne(`${apiUrl}/sessions/${sessionId}`);
      deleteReq.flush({});
      tick();

      // Should NOT make list request
      httpMock.expectNone(`${apiUrl}/sessions`);
    }));
  });

  describe('deleteBulk', () => {
    it('should delete multiple sessions and refresh once', fakeAsync(() => {
      const sessionIds = ['s1', 's2', 's3'];

      service.deleteBulk(sessionIds);

      // Expects 3 delete requests
      sessionIds.forEach(id => {
        const req = httpMock.expectOne(`${apiUrl}/sessions/${id}`);
        req.flush({});
      });

      // Expects single list refresh at end
      const listReq = httpMock.expectOne(`${apiUrl}/sessions`);
      listReq.flush({ sessions: [] });
      tick();
    }));
  });
});
