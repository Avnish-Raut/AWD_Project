import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrganizerDashboardComponent } from './organizer-dashboard';
import { AuthService } from '../auth/auth.service';
import { EventService } from '../events/event.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

describe('OrganizerDashboardComponent', () => {
  let component: OrganizerDashboardComponent;
  let fixture: ComponentFixture<OrganizerDashboardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let cdrSpy: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getProfile', 'logout']);
    eventServiceSpy = jasmine.createSpyObj('EventService', ['getOrgEvents', 'generateReport', 'getReport', 'deleteEvent']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterModule, OrganizerDashboardComponent], // standalone
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should navigate to user-dashboard if role is not ORG', () => {
      authServiceSpy.getProfile.and.returnValue(of({ role: 'USER' }));
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/user-dashboard']);
    });

    it('should load hosted events if role is ORG', () => {
      authServiceSpy.getProfile.and.returnValue(of({ role: 'ORG' }));
      const mockEvents = [{ event_id: 1, name: 'Event 1' }];
      eventServiceSpy.getOrgEvents.and.returnValue(of(mockEvents));
      
      component.ngOnInit();
      
      expect(eventServiceSpy.getOrgEvents).toHaveBeenCalled();
      expect(component.myHostedEvents).toEqual(mockEvents);
      expect(component.loading).toBeFalse();
    });

    it('should navigate to login on profile fetch error', () => {
      authServiceSpy.getProfile.and.returnValue(throwError(() => new Error('Unauth')));
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loadHostedEvents', () => {
    it('should handle error when loading events', () => {
      eventServiceSpy.getOrgEvents.and.returnValue(throwError(() => new Error('Error')));
      component.loadHostedEvents();
      expect(component.loading).toBeFalse();
    });
  });

  describe('generateReport', () => {
    it('should do nothing if currently generating for that event', () => {
      component.isGeneratingReport[1] = true;
      component.generateReport(1);
      expect(eventServiceSpy.generateReport).not.toHaveBeenCalled();
    });

    it('should start generation and track progress on success', () => {
      eventServiceSpy.generateReport.and.returnValue(of({ report_id: 10 }));
      spyOn(component, 'trackReportProgress');
      
      component.generateReport(1);
      
      expect(component.isGeneratingReport[1]).toBeTrue();
      expect(component.trackReportProgress).toHaveBeenCalledWith(1, 10);
    });

    it('should start generation and map response id fallback', () => {
      eventServiceSpy.generateReport.and.returnValue(of({ id: 10 }));
      spyOn(component, 'trackReportProgress');
      
      component.generateReport(1);
      
      expect(component.isGeneratingReport[1]).toBeTrue();
      expect(component.trackReportProgress).toHaveBeenCalledWith(1, 10);
    });

    it('should start generation and map event fallback', () => {
      eventServiceSpy.generateReport.and.returnValue(of({ }));
      spyOn(component, 'trackReportProgress');
      
      component.generateReport(1);
      
      expect(component.isGeneratingReport[1]).toBeTrue();
      expect(component.trackReportProgress).toHaveBeenCalledWith(1, 1);
    });

    it('should handle error during generation start', () => {
      spyOn(window, 'alert');
      eventServiceSpy.generateReport.and.returnValue(throwError(() => new Error('Failed')));
      
      component.generateReport(1);
      
      expect(component.isGeneratingReport[1]).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith('Failed to start report generation.');
    });
  });

  describe('deleteEvent', () => {
    it('should not delete if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteEvent(1);
      expect(eventServiceSpy.deleteEvent).not.toHaveBeenCalled();
    });

    it('should delete event and remove from list on confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      eventServiceSpy.deleteEvent.and.returnValue(of({}));
      component.myHostedEvents = [{ event_id: 1 }, { event_id: 2 }];
      
      component.deleteEvent(1);
      
      expect(eventServiceSpy.deleteEvent).toHaveBeenCalledWith(1);
      expect(component.myHostedEvents.length).toBe(1);
      expect(component.myHostedEvents[0].event_id).toBe(2);
    });

    it('should handle error on delete', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      eventServiceSpy.deleteEvent.and.returnValue(throwError(() => new Error('Failed')));
      component.deleteEvent(1);
      expect(eventServiceSpy.deleteEvent).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call logout and navigate to login', () => {
      component.logout();
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('trackReportProgress', () => {
    let mockEventSource: any;

    beforeEach(() => {
      mockEventSource = {
        onmessage: null,
        onerror: null,
        close: jasmine.createSpy('close')
      };
      spyOn(window as any, 'EventSource').and.returnValue(mockEventSource);
    });

    it('should update progress on valid message', () => {
      component.isGeneratingReport[1] = true;
      component.trackReportProgress(1, 100);

      mockEventSource.onmessage({
        data: JSON.stringify({ progress: 50, status: 'IN_PROGRESS' })
      });

      expect(component.reportProgress[1]).toBe(50);
    });

    it('should handle JSON parse errors gracefully', () => {
      spyOn(console, 'error');
      component.trackReportProgress(1, 100);

      mockEventSource.onmessage({
        data: 'invalid json'
      });

      expect(console.error).toHaveBeenCalledWith('Error parsing SSE message', jasmine.any(Object));
    });

    it('should handle EventSource onerror', () => {
      component.isGeneratingReport[1] = true;
      component.trackReportProgress(1, 100);

      mockEventSource.onerror(new Error('Network Error'));

      expect(mockEventSource.close).toHaveBeenCalled();
      expect(component.isGeneratingReport[1]).toBeFalse();
    });
  });
});
