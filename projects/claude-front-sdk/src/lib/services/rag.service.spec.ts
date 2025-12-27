import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RAGService } from './rag.service';
import { ConfigService, CLAUDE_CONFIG } from './config.service';

describe('RAGService', () => {
  let service: RAGService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://test-api.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RAGService,
        ConfigService,
        { provide: CLAUDE_CONFIG, useValue: { apiUrl } }
      ]
    });
    service = TestBed.inject(RAGService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty documents', () => {
      expect(service.documents()).toEqual([]);
    });

    it('should not be searching', () => {
      expect(service.isSearching()).toBeFalse();
    });
  });

  describe('search', () => {
    it('should send search request with query and top_k', fakeAsync(() => {
      const mockResponse = {
        results: [
          { id: '1', content: 'Result 1', score: 0.95 },
          { id: '2', content: 'Result 2', score: 0.85 }
        ],
        query: 'test query'
      };

      service.search('test query', 5).then(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/rag/search`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ query: 'test query', top_k: 5 });
      req.flush(mockResponse);
      tick();
    }));

    it('should use default top_k of 5', fakeAsync(() => {
      service.search('test');

      const req = httpMock.expectOne(`${apiUrl}/rag/search`);
      expect(req.request.body.top_k).toBe(5);
      req.flush({ results: [] });
      tick();
    }));

    it('should set isSearching true while searching', fakeAsync(() => {
      service.search('test');

      expect(service.isSearching()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/rag/search`);
      req.flush({ results: [] });
      tick();

      expect(service.isSearching()).toBeFalse();
    }));

    it('should set isSearching false on error', fakeAsync(() => {
      service.search('test').catch(() => {});

      const req = httpMock.expectOne(`${apiUrl}/rag/search`);
      req.error(new ErrorEvent('Network error'));
      tick();

      expect(service.isSearching()).toBeFalse();
    }));
  });

  describe('listDocuments', () => {
    it('should fetch and update documents signal', fakeAsync(() => {
      const mockDocs = [
        { id: '1', nome: 'Doc 1', tipo: 'pdf' },
        { id: '2', nome: 'Doc 2', tipo: 'txt' }
      ];

      service.listDocuments().then(result => {
        expect(result).toEqual(mockDocs);
        expect(service.documents()).toEqual(mockDocs);
      });

      const req = httpMock.expectOne(`${apiUrl}/rag/documents`);
      expect(req.request.method).toBe('GET');
      req.flush({ documents: mockDocs });
      tick();
    }));
  });

  describe('deleteDocument', () => {
    it('should send DELETE request and refresh documents', fakeAsync(() => {
      const docId = 'doc-to-delete';

      service.deleteDocument(docId);

      const deleteReq = httpMock.expectOne(`${apiUrl}/rag/documents/${docId}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({});

      // Expects list refresh
      const listReq = httpMock.expectOne(`${apiUrl}/rag/documents`);
      listReq.flush({ documents: [] });
      tick();

      expect(service.documents()).toEqual([]);
    }));
  });
});
