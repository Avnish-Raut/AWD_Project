import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseEventsComponent } from './events';

describe('BrowseEventsComponent', () => {
  let component: BrowseEventsComponent;
  let fixture: ComponentFixture<BrowseEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseEventsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseEventsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
