import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventManagement } from './event-management';
import { EventService } from '../../../events/event.service';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('EventManagement', () => {
  let component: EventManagement;
  let fixture: ComponentFixture<EventManagement>;
  let mockEventService: jasmine.SpyObj<EventService>;

  beforeEach(async () => {
    mockEventService = jasmine.createSpyObj('EventService', ['getEventsForAdmin', 'cancelEvent']);

    await TestBed.configureTestingModule({
      imports: [EventManagement],
      providers: [
        { provide: EventService, useValue: mockEventService },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockEventService.getEventsForAdmin.and.returnValue(of({ data: [], total: 0 }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load events on init', () => {
    const mockResponse = {
      data: [{ event_id: 1, title: 'Test Event' }],
      total: 1
    };
    mockEventService.getEventsForAdmin.and.returnValue(of(mockResponse));

    fixture.detectChanges();

    expect(mockEventService.getEventsForAdmin).toHaveBeenCalledWith('', 0, 10);
    expect(component.events.length).toBe(1);
    expect(component.totalEvents).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle pagination', () => {
    mockEventService.getEventsForAdmin.and.returnValue(of({ data: [], total: 20 }));
    fixture.detectChanges();

    component.totalEvents = 20;
    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(mockEventService.getEventsForAdmin).toHaveBeenCalledWith('', 10, 10);

    component.previousPage();
    expect(component.currentPage).toBe(1);
    expect(mockEventService.getEventsForAdmin).toHaveBeenCalledWith('', 0, 10);
  });

  it('should search events', () => {
    mockEventService.getEventsForAdmin.and.returnValue(of({ data: [], total: 0 }));
    fixture.detectChanges();

    component.searchQuery = 'Test';
    component.onSearch();

    expect(component.currentPage).toBe(1);
    expect(mockEventService.getEventsForAdmin).toHaveBeenCalledWith('Test', 0, 10);
  });

  it('should cancel an event when confirmed', () => {
    mockEventService.getEventsForAdmin.and.returnValue(of({ data: [], total: 0 }));
    mockEventService.cancelEvent.and.returnValue(of({}));
    spyOn(window, 'confirm').and.returnValue(true);
    
    fixture.detectChanges();

    const mockEvent = { event_id: 1, title: 'Test Event', is_cancelled: false, is_published: true };
    component.cancelEvent(mockEvent);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockEventService.cancelEvent).toHaveBeenCalledWith(1);
    expect(mockEvent.is_cancelled).toBeTrue();
    expect(mockEvent.is_published).toBeFalse();
  });
});
