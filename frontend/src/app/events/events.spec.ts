import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowseEventsComponent } from './events';
import { EventService } from './event.service';
import { AuthService } from '../auth/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('BrowseEventsComponent', () => {
  let component: BrowseEventsComponent;
  let fixture: ComponentFixture<BrowseEventsComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockEvents = [
    { event_id: 1, title: 'Music Fest', location: 'London' }
  ];

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj('EventService', ['getPublishedEvents']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);

    await TestBed.configureTestingModule({
      imports: [BrowseEventsComponent, FormsModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]) 
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    eventServiceSpy.getPublishedEvents.and.returnValue(of(mockEvents));
    
    fixture = TestBed.createComponent(BrowseEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load events on init', () => {
    expect(component.events.length).toBe(1);
    expect(eventServiceSpy.getPublishedEvents).toHaveBeenCalled();
  });

  it('should re-fetch events when onFilterChange is called', () => {
    component.searchFilters.search = 'London';
    component.onFilterChange();
    
    expect(eventServiceSpy.getPublishedEvents).toHaveBeenCalledTimes(2);
  });

  it('should navigate to organizer-dashboard if role is ORG', () => {
    authServiceSpy.getRole.and.returnValue('ORG');
    component.backToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/organizer-dashboard']);
  });

  it('should navigate to user-dashboard if role is not ORG', () => {
    authServiceSpy.getRole.and.returnValue('USER');
    component.backToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/user-dashboard']);
  });

});