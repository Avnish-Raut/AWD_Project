import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailsComponent } from './event-details';

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent;
  let fixture: ComponentFixture<EventDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
