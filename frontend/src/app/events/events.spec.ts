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

    eventServiceSpy.getPublishedEvents.and.returnValue(of([]));
    fixture = TestBed.createComponent(BrowseEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should navigate to organizer-dashboard if user is ORG', () => {
    const router = TestBed.inject(Router); 
    spyOn(router, 'navigate'); 
    
    authServiceSpy.getRole.and.returnValue('ORG');
    
    component.backToDashboard();
    
    expect(router.navigate).toHaveBeenCalledWith(['/organizer-dashboard']);
  });
});