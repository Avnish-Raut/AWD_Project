import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEventComponent } from './create-event';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { EventService } from '../event.service';
import { of, throwError } from 'rxjs';

describe('CreateEventComponent', () => {
  let component: CreateEventComponent;
  let fixture: ComponentFixture<CreateEventComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj('EventService', ['createEvent']);

    await TestBed.configureTestingModule({
      imports: [CreateEventComponent, ReactiveFormsModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        provideRouter([]) // THIS FIXES THE 'ROOT' ERROR
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate title length', () => {
    const title = component.eventForm.controls['title'];
    title.setValue('Hi');
    expect(title.hasError('minlength')).toBeTrue();
  });

  it('should handle API error gracefully', () => {
    component.eventForm.setValue({
      title: 'Workshop',
      description: 'Test Desc',
      location: 'Online',
      event_date: '2026-05-01',
      capacity: 50
    });
    eventServiceSpy.createEvent.and.returnValue(throwError(() => new Error('Server Error')));
    component.onSubmit();
    expect(component.errorMessage).toBe('Failed to create event. Please try again.');
  });
});