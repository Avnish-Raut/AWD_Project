import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticipantListComponent } from './participant-list';
import { EventService } from '../event.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('ParticipantListComponent', () => {
  let component: ParticipantListComponent;
  let fixture: ComponentFixture<ParticipantListComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;

  // Mock data for testing
  const mockParticipants = [
    { user: { username: 'john_doe', email: 'john@example.com' }, registration_date: new Date() },
    { user: { username: 'jane_smith', email: 'jane@example.com' }, registration_date: new Date() }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('EventService', ['getParticipants']);

    await TestBed.configureTestingModule({
      imports: [ParticipantListComponent], // Standalone component
      providers: [
        { provide: EventService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '123' // Simulates /events/123/participants
              }
            }
          }
        },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantListComponent);
    component = fixture.componentInstance;
    eventServiceSpy = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- LINE & FUNCTION COVERAGE: ngOnInit ---
  it('should initialize with eventId from route params', () => {
    // Mock service to return empty array so ngOnInit doesn't crash
    eventServiceSpy.getParticipants.and.returnValue(of([]));
    
    component.ngOnInit();
    
    expect(component.eventId).toBe(123);
    expect(eventServiceSpy.getParticipants).toHaveBeenCalledWith(123);
  });

  // --- BRANCH COVERAGE: Success Path ---
  it('should load participants successfully', () => {
    eventServiceSpy.getParticipants.and.returnValue(of(mockParticipants));

    component.loadParticipants();

    expect(component.participants.length).toBe(2);
    expect(component.participants).toEqual(mockParticipants);
    expect(component.loading).toBeFalse();
  });

  // --- BRANCH COVERAGE: Error Path ---
  it('should handle error when loading participants fails', () => {
    // Spy on console.error to keep the test output clean
    spyOn(console, 'error');
    eventServiceSpy.getParticipants.and.returnValue(throwError(() => new Error('API Error')));

    component.loadParticipants();

    expect(component.participants.length).toBe(0);
    expect(component.loading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith('Failed to load participants', jasmine.any(Error));
  });

  // --- BRANCH COVERAGE: Route Param check ---
  it('should not call loadParticipants if id is missing in route', () => {
    // Temporarily override the ActivatedRoute mock for this specific test
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue(null);
    const loadSpy = spyOn(component, 'loadParticipants');

    component.ngOnInit();

    expect(loadSpy).not.toHaveBeenCalled();
    expect(component.eventId).toBe(0);
  });
});