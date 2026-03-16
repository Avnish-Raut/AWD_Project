import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDetailsComponent } from './event-details';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../events/event.service';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent;
  let fixture: ComponentFixture<EventDetailsComponent>;

  let mockEventService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let mockHttp: any;

  beforeEach(async () => {
    mockEventService = {
      getEventById: jasmine.createSpy().and.returnValue(of({ event_id: 1 })),
      updateEvent: jasmine.createSpy().and.returnValue(of({})),
      registerForEvent: jasmine.createSpy().and.returnValue(of({})),
    };

    mockAuthService = {
      getRole: jasmine.createSpy().and.returnValue('USER'),
      getUserEvents: jasmine.createSpy().and.returnValue(of([{ event_id: 1 }])),
    };

    mockRouter = {
      navigate: jasmine.createSpy(),
    };

    mockHttp = {
      post: jasmine.createSpy().and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailsComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load event data on init', () => {
    fixture.detectChanges();
    expect(mockEventService.getEventById).toHaveBeenCalled();
  });

  it('should set selected file', () => {
    const file = new File(['test'], 'test.png');

    const event = {
      target: { files: [file] },
    };

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(file);
  });

  it('should start edit mode', () => {
    component.event = { event_id: 1, event_date: '2025-01-01' };

    component.startEdit();

    expect(component.isEditing).toBeTrue();
    expect(component.editForm.event_id).toEqual(1);
  });

  it('should cancel edit', () => {
    component.isEditing = true;
    component.selectedFile = new File(['a'], 'a.txt');

    component.cancelEdit();

    expect(component.isEditing).toBeFalse();
    expect(component.selectedFile).toBeNull();
  });

  it('should save edit without file', () => {
    component.event = { event_id: 1 };
    component.editForm = {};

    component.saveEdit();

    expect(mockEventService.updateEvent).toHaveBeenCalled();
  });

  it('should save edit with file upload', () => {
    component.event = { event_id: 1 };
    component.editForm = {};
    component.selectedFile = new File(['a'], 'a.txt');

    component.saveEdit();

    expect(mockEventService.updateEvent).toHaveBeenCalled();
    expect(mockHttp.post).toHaveBeenCalled();
  });

  it('should detect already registered event', () => {
    component.event = { event_id: 1 };
    component.myEvents = [{ event_id: 1 }];

    const result = component.isAlreadyRegistered();

    expect(result).toBeTrue();
  });

  it('should register for event', () => {
    component.event = { event_id: 1 };

    component.register();

    expect(mockEventService.registerForEvent).toHaveBeenCalled();
  });

  it('should navigate back', () => {
    component.userRole = 'ORG';

    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should return correct backLink for ORG', () => {
    mockAuthService.getRole.and.returnValue('ORG');

    expect(component.backLink).toBe('/organizer-dashboard');
  });

  it('should return correct backLabel for USER', () => {
    mockAuthService.getRole.and.returnValue('USER');

    expect(component.backLabel).toBe('← Back to Browse');
  });

  it('should handle registration error', () => {
    mockEventService.registerForEvent.and.returnValue(
      throwError(() => ({ error: { message: 'Already registered' } })),
    );

    component.event = { event_id: 1 };

    component.register();

    expect(mockEventService.registerForEvent).toHaveBeenCalled();
  });
});
