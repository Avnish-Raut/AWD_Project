import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagement } from './user-management';
import { UsersService } from '../../../core/services/users/users.service';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('UserManagement', () => {
  let component: UserManagement;
  let fixture: ComponentFixture<UserManagement>;
  let mockUsersService: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    mockUsersService = jasmine.createSpyObj('UsersService', ['getUsers', 'updateUserRole', 'deactivateUser', 'reactivateUser']);

    await TestBed.configureTestingModule({
      imports: [UserManagement],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockUsersService.getUsers.and.returnValue(of({ data: [], total: 0 }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const mockResponse = {
      data: [{ user_id: 1, username: 'TestUser', email: 'test@test.com', role: 'USER' as const, created_at: '2023-01-01', deleted_at: null }],
      total: 1
    };
    mockUsersService.getUsers.and.returnValue(of(mockResponse));

    fixture.detectChanges();

    expect(mockUsersService.getUsers).toHaveBeenCalledWith('', 0, 10);
    expect(component.users.length).toBe(1);
    expect(component.totalUsers).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle array response from getUsers', () => {
    const mockResponse = [{ user_id: 1, username: 'TestUser', email: 'test@test.com', role: 'USER' as const, created_at: '2023-01-01', deleted_at: null }];
    mockUsersService.getUsers.and.returnValue(of(mockResponse as any));

    fixture.detectChanges();

    expect(component.users.length).toBe(1);
    expect(component.totalUsers).toBe(1);
  });

  it('should handle pagination', () => {
    mockUsersService.getUsers.and.returnValue(of({ data: [], total: 20 }));
    fixture.detectChanges();

    component.totalUsers = 20;
    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(mockUsersService.getUsers).toHaveBeenCalledWith('', 10, 10);

    component.previousPage();
    expect(component.currentPage).toBe(1);
    expect(mockUsersService.getUsers).toHaveBeenCalledWith('', 0, 10);
  });

  it('should search users', () => {
    mockUsersService.getUsers.and.returnValue(of({ data: [], total: 0 }));
    fixture.detectChanges();

    component.searchQuery = 'Jane';
    component.onSearch();

    expect(component.currentPage).toBe(1);
    expect(mockUsersService.getUsers).toHaveBeenCalledWith('Jane', 0, 10);
  });

  it('should update role when confirmed', () => {
    mockUsersService.getUsers.and.returnValue(of({ data: [], total: 0 }));
    mockUsersService.updateUserRole.and.returnValue(of({ role: 'ORG' } as any));
    spyOn(window, 'confirm').and.returnValue(true);
    
    fixture.detectChanges();

    const mockUser: any = { user_id: 1, username: 'TestUser', role: 'USER' };
    component.updateRole(mockUser, 'ORG');

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith(1, 'ORG');
    expect(mockUser.role).toBe('ORG');
  });

  it('should deactivate user when confirmed', () => {
    mockUsersService.getUsers.and.returnValue(of({ data: [], total: 0 }));
    mockUsersService.deactivateUser.and.returnValue(of({} as any));
    spyOn(window, 'confirm').and.returnValue(true);
    
    fixture.detectChanges();

    const mockUser: any = { user_id: 1, username: 'TestUser', deleted_at: null };
    component.deactivateUser(mockUser);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockUsersService.deactivateUser).toHaveBeenCalledWith(1);
    expect(mockUser.deleted_at).not.toBeNull();
  });
});
