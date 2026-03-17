import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserDashboardComponent, ReloadService } from './user-dashboard';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let cdrMock: any;
  let reloadServiceMock: any;

  beforeEach(async () => {
    // Mocks
    authServiceMock = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ id: 1, name: 'Test User' })),
      getUserEvents: jasmine
        .createSpy('getUserEvents')
        .and.returnValue(of([{ title: 'Event 1', event_date: '2026-03-18', event_id: 101 }])),
      cancelRegistration: jasmine.createSpy('cancelRegistration').and.returnValue(of({})),
      logout: jasmine.createSpy('logout'),
    };

    routerMock = { navigate: jasmine.createSpy('navigate') };
    cdrMock = { detectChanges: jasmine.createSpy('detectChanges') };
    reloadServiceMock = { reload: jasmine.createSpy('reload') };

    // Override window confirm & alert
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert').and.stub();

    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ChangeDetectorRef, useValue: cdrMock },
        { provide: ReloadService, useValue: reloadServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on ngOnInit', () => {
    component.ngOnInit();
    expect(authServiceMock.getProfile).toHaveBeenCalled();
    expect(component.user.name).toBe('Test User');
  });

  it('should populate calendar events', () => {
    component.loadUserEvents();

    expect((component.calendarOptions.events as any[]).length).toBe(1);
  });

  it('should navigate to login if profile load fails', () => {
    authServiceMock.getProfile.and.returnValue(throwError({ status: 500 }));
    component.ngOnInit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle event click and navigate', () => {
    const eventArg: any = { event: { id: 101 } };
    component.handleEventClick(eventArg);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/events', 101]);
  });

  it('should cancel registration when user confirms', fakeAsync(() => {
    component.cancelRegistration(101);
    expect(authServiceMock.cancelRegistration).toHaveBeenCalledWith(101);
    tick();
    expect(reloadServiceMock.reload).toHaveBeenCalled();
  }));

  it('should not cancel registration when user cancels', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);
    component.cancelRegistration(101);
    expect(authServiceMock.cancelRegistration).not.toHaveBeenCalled();
    expect(reloadServiceMock.reload).not.toHaveBeenCalled();
  });

  it('should logout and navigate to login', () => {
    component.logout();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
