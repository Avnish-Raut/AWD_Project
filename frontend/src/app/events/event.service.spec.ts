import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EventService]
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get published events with some filters', () => {
    service.getPublishedEvents({ search: 'Rock', location: 'NY' }).subscribe();
    
    const req = httpMock.expectOne(req => req.url === 'http://localhost:3000/api/events');
    expect(req.request.params.get('search')).toBe('Rock');
    expect(req.request.params.get('location')).toBe('NY');
    expect(req.request.params.has('date_from')).toBeFalse();
    req.flush([]);
  });

  it('should create an event', () => {
    const newEvent = { title: 'Test' };
    service.createEvent(newEvent).subscribe();
    
    const req = httpMock.expectOne('http://localhost:3000/api/events');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should update an event', () => {
    service.updateEvent(1, { title: 'Updated' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/events/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should get org events', () => {
    service.getOrgEvents().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/events/my/events');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get events for admin with search only', () => {
    service.getEventsForAdmin('Music').subscribe();
    const req = httpMock.expectOne(req => req.url.includes('/admin/list'));
    expect(req.request.params.get('search')).toBe('Music');
    expect(req.request.params.has('skip')).toBeFalse();
    req.flush({ data: [], total: 0 });
  });

  it('should delete an event', () => {
    service.deleteEvent(10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/events/10');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should get events for admin with pagination', () => {
    service.getEventsForAdmin('', 0, 10).subscribe();
    const req = httpMock.expectOne(req => req.url.includes('/admin/list'));
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.get('skip')).toBe('0');
    expect(req.request.params.get('take')).toBe('10');
    req.flush({ data: [], total: 0 });
  });
  
  it('should register for an event', () => {
    service.registerForEvent(5).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/events/5/register');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should get events for admin with skip pagination', () => {
    service.getEventsForAdmin('', 0).subscribe();
    const req = httpMock.expectOne(req => req.url.includes('/admin/list'));
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.get('skip')).toBe('0');
    expect(req.request.params.has('take')).toBeFalse();
    req.flush({ data: [], total: 0 });
  });
});