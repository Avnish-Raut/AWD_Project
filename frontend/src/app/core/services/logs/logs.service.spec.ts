import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LogsService, LogsResponse } from './logs.service';
import { environment } from '../../../../environments/environment';

describe('LogsService', () => {
  let service: LogsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/logs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LogsService]
    });
    service = TestBed.inject(LogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test main functionality (No params)
  it('should get logs with no parameters', () => {
    const mockResponse: LogsResponse = { logs: [], total: 0, limit: 10, offset: 0 };

    service.getLogs().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    req.flush(mockResponse);
  });

  // Test only one filter branch instead of all of them
  it('should set level param when level is filtered', () => {
    service.getLogs('ERROR').subscribe();

    const req = httpMock.expectOne(request => 
      request.url === apiUrl && request.params.get('level') === 'ERROR'
    );
    expect(req.request.params.has('level')).toBeTrue();
    req.flush({});
  });

});