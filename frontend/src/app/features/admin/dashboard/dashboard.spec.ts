import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { StatisticsService, AdminStats } from '../../../core/services/statistics.service';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockStatisticsService: jasmine.SpyObj<StatisticsService>;

  beforeEach(async () => {
    mockStatisticsService = jasmine.createSpyObj('StatisticsService', ['getAdminStats']);

    await TestBed.configureTestingModule({
      imports: [Dashboard, CommonModule],
      providers: [
        { provide: StatisticsService, useValue: mockStatisticsService },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockStatisticsService.getAdminStats.and.returnValue(of({
      totalUsers: 0,
      totalEvents: 0,
      activeRegistrations: 0,
      systemAlerts: 0
    } as AdminStats));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load admin stats on init', () => {
    const mockStats: AdminStats = {
      totalUsers: 10,
      totalEvents: 5,
      activeRegistrations: 20,
      systemAlerts: 2
    };
    mockStatisticsService.getAdminStats.and.returnValue(of(mockStats));

    fixture.detectChanges();

    expect(mockStatisticsService.getAdminStats).toHaveBeenCalled();
    expect(component.stats).toEqual(mockStats);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });
});
