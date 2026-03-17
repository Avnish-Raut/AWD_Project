import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemLogs } from './system-logs';
import { LogsService } from '../../../core/services/logs/logs.service';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('SystemLogs', () => {
  let component: SystemLogs;
  let fixture: ComponentFixture<SystemLogs>;
  let mockLogsService: jasmine.SpyObj<LogsService>;

  beforeEach(async () => {
    mockLogsService = jasmine.createSpyObj('LogsService', ['getLogs']);

    await TestBed.configureTestingModule({
      imports: [SystemLogs],
      providers: [
        { provide: LogsService, useValue: mockLogsService },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SystemLogs);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockLogsService.getLogs.and.returnValue(of({ logs: [], total: 0, limit: 15, offset: 0 }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load logs on init', () => {
    const mockResponse = {
      logs: [{ log_id: 1, level: 'INFO' as const, message: 'Test Log', user_id: 1, created_at: new Date().toISOString() }],
      total: 1,
      limit: 15,
      offset: 0
    };
    mockLogsService.getLogs.and.returnValue(of(mockResponse));

    fixture.detectChanges();

    expect(mockLogsService.getLogs).toHaveBeenCalledWith('ALL', 0, 15);
    expect(component.logs.length).toBe(1);
    expect(component.totalLogs).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle pagination', () => {
    mockLogsService.getLogs.and.returnValue(of({ logs: [], total: 30, limit: 15, offset: 15 }));
    fixture.detectChanges();

    component.totalLogs = 30;
    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(mockLogsService.getLogs).toHaveBeenCalledWith('ALL', 15, 15);

    component.previousPage();
    expect(component.currentPage).toBe(1);
    expect(mockLogsService.getLogs).toHaveBeenCalledWith('ALL', 0, 15);
  });

  it('should filter logs', () => {
    mockLogsService.getLogs.and.returnValue(of({ logs: [], total: 0, limit: 15, offset: 0 }));
    fixture.detectChanges();

    component.selectedLevel = 'ERROR';
    component.onFilterChange();

    expect(component.currentPage).toBe(1);
    expect(mockLogsService.getLogs).toHaveBeenCalledWith('ERROR', 0, 15);
  });
});
