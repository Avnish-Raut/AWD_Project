import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrganizerDashboardComponent } from './organizer-dashboard';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { EventService } from '../events/event.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('OrganizerDashboardComponent', () => {
  let component: OrganizerDashboardComponent;
  let fixture: ComponentFixture<OrganizerDashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getProfile', 'logout']);
    mockEventService = jasmine.createSpyObj('EventService', ['getOrgEvents', 'generateReport', 'getReport', 'deleteEvent']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [OrganizerDashboardComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: EventService, useValue: mockEventService },
        { provide: Router, useValue: mockRouter },
        { provide: ChangeDetectorRef, useValue: mockCdr },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should redirect non-organizers', () => {
    mockAuthService.getProfile.and.returnValue(of({ role: 'USER' }));
    fixture.detectChanges();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-dashboard']);
  });

  it('should redirect if getProfile fails', () => {
    mockAuthService.getProfile.and.returnValue(throwError(() => new Error('Error')));
    fixture.detectChanges();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load events', () => {
    mockAuthService.getProfile.and.returnValue(of({ role: 'ORG' }));
    mockEventService.getOrgEvents.and.returnValue(of([{ event_id: 1, title: 'Org Event' }]));
    
    fixture.detectChanges();
    
    expect(component.myHostedEvents.length).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading events', () => {
    mockAuthService.getProfile.and.returnValue(of({ role: 'ORG' }));
    mockEventService.getOrgEvents.and.returnValue(throwError(() => new Error('Error')));
    
    fixture.detectChanges();
    
    expect(component.loading).toBeFalse();
    expect(component.myHostedEvents.length).toBe(0);
  });

  it('should call generateReport', () => {
    component.isGeneratingReport[1] = false;
    mockEventService.generateReport.and.returnValue(of({ report_id: 123 }));
    spyOn(component, 'trackReportProgress');
    
    component.generateReport(1);
    
    expect(component.isGeneratingReport[1]).toBeTrue();
    expect(mockEventService.generateReport).toHaveBeenCalledWith(1);
  });

  it('should handle generate report error', () => {
    component.isGeneratingReport[1] = false;
    mockEventService.generateReport.and.returnValue(throwError(() => new Error('Error')));
    spyOn(window, 'alert');
    
    component.generateReport(1);
    
    expect(component.isGeneratingReport[1]).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Failed to start report generation.');
  });

  it('should ignore generateReport if already generating', () => {
    component.isGeneratingReport[1] = true;
    component.generateReport(1);
    expect(mockEventService.generateReport).not.toHaveBeenCalled();
  });

  it('should setup SSE correctly in trackReportProgress', () => {
    spyOn(localStorage, 'getItem').and.returnValue('fake-token');
    
    // Create a mock EventSource to prevent actual network calls
    class MockEventSource {
      onmessage: any;
      onerror: any;
      close() {}
    }
    const mockDb = new MockEventSource();
    spyOn(window as any, 'EventSource').and.returnValue(mockDb);
    
    component.trackReportProgress(1, 123);
    
    expect(window.EventSource).toHaveBeenCalledWith('http://localhost:3000/api/reports/123/progress?token=fake-token');
    
    // trigger a fake message
    mockDb.onmessage({ data: JSON.stringify({ progress: 50 }) });
    expect(component.reportProgress[1]).toBe(50);
  });

  it('should delete event successfully', () => {
    component.myHostedEvents = [{ event_id: 1 }];
    spyOn(window, 'confirm').and.returnValue(true);
    mockEventService.deleteEvent.and.returnValue(of({}));
    
    component.deleteEvent(1);
    
    expect(mockEventService.deleteEvent).toHaveBeenCalledWith(1);
    expect(component.myHostedEvents.length).toBe(0);
  });

  it('should not delete event if confirm returns false', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteEvent(1);
    
    expect(mockEventService.deleteEvent).not.toHaveBeenCalled();
  });

  it('should sign out and redirect', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
