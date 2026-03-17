import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent, ReloadService } from './profile';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  // 1. Define Robust Mocks
  const mockUserService = {
    getProfile: () => of({ username: 'testuser', email: 'test@test.com', avatar_url: 'pic.jpg' }),
    updateProfile: (data: any) => of({ username: 'updated_user', email: 'test@test.com' }),
    deleteAccount: () => of({ message: 'Account deleted' }),
    uploadAvatar: (file: File) => of({ avatar_url: 'new_pic.jpg' }),
    deleteAvatar: () => of({}),
  };

  const mockAuthService = { logout: () => {} };
  const mockRouter = { navigate: (path: any[]) => {} };
  const mockReloadService = { reload: () => {} };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        CommonModule,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ReloadService, useValue: mockReloadService },
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    // Neutralize browser globals to prevent Karma disconnects
    window.alert = () => {};
    window.confirm = () => true;

    fixture.detectChanges();
  });

  it('should create and load profile on init', () => {
    expect(component).toBeTruthy();
    expect(component.user.username).toBe('testuser');
    expect(component.loading).toBeFalse();
  });

  // --- UPDATE PROFILE TESTS ---

  it('should update profile WITHOUT password change', () => {
    const updateSpy = spyOn(mockUserService, 'updateProfile').and.callThrough();

    component.user = { username: 'testuser', email: 'test@test.com', avatar_url: 'pic.jpg' };
    component.updateDto = { new_password: '' }; // Empty password

    component.onUpdateProfile();

    // Payload should NOT contain password fields
    expect(updateSpy).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@test.com',
      avatar_url: 'pic.jpg',
    });
  });

  it('should update profile WITH password change', () => {
    const updateSpy = spyOn(mockUserService, 'updateProfile').and.callThrough();

    component.user = { username: 'testuser', email: 'test@test.com' };
    component.updateDto = { current_password: 'old', new_password: 'new' };

    component.onUpdateProfile();

    // Payload SHOULD contain password fields
    expect(updateSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        current_password: 'old',
        new_password: 'new',
      }),
    );
  });

  it('should handle NestJS validation array errors (400)', () => {
    const alertSpy = spyOn(window, 'alert');
    spyOn(mockUserService, 'updateProfile').and.returnValue(
      throwError(() => ({
        status: 400,
        error: { message: ['Error 1', 'Error 2'] },
      })),
    );

    component.onUpdateProfile();
    expect(alertSpy).toHaveBeenCalledWith('Error 1\nError 2');
  });

  // --- DELETE ACCOUNT TESTS ---

  it('should open delete modal', () => {
    component.confirmDelete();
    expect(component.showDeleteModal).toBeTrue();
    expect(component.deleteConfirmText).toBe('');
  });

  it('should only execute delete if text is "DELETE"', () => {
    const deleteSpy = spyOn(mockUserService, 'deleteAccount');
    component.deleteConfirmText = 'WRONG_TEXT';
    component.executeDelete();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should execute delete, logout, and navigate on success', () => {
    const deleteSpy = spyOn(mockUserService, 'deleteAccount').and.callThrough();
    const logoutSpy = spyOn(mockAuthService, 'logout');
    const navSpy = spyOn(mockRouter, 'navigate');

    component.deleteConfirmText = 'DELETE';
    component.executeDelete();

    expect(deleteSpy).toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  // --- AVATAR TESTS ---

  it('should upload avatar and update user object', () => {
    const uploadSpy = spyOn(mockUserService, 'uploadAvatar').and.callThrough();
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } };

    component.onFileSelected(event);

    expect(uploadSpy).toHaveBeenCalledWith(file);
    expect(component.user.avatar_url).toBe('new_pic.jpg');
    expect(component.loading).toBeFalse();
  });

  it('should remove avatar if user confirms', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const deleteSpy = spyOn(mockUserService, 'deleteAvatar').and.callThrough();

    component.removeAvatar();

    expect(deleteSpy).toHaveBeenCalled();
    expect(component.user.avatar_url).toBeNull();
  });
  it('should do nothing if onFileSelected is called with no file', () => {
    const uploadSpy = spyOn(mockUserService, 'uploadAvatar');
    const event = { target: { files: [] } }; // Empty files array

    component.onFileSelected(event);

    expect(uploadSpy).not.toHaveBeenCalled();
  });
  it('should handle generic update error (non-400)', () => {
    const alertSpy = spyOn(window, 'alert');
    spyOn(mockUserService, 'updateProfile').and.returnValue(
      throwError(() => ({
        status: 500,
        error: { message: 'Database failure' },
      })),
    );

    component.onUpdateProfile();

    expect(alertSpy).toHaveBeenCalledWith('Database failure');
  });
  it('should handle error during account deletion', () => {
    const alertSpy = spyOn(window, 'alert');
    spyOn(mockUserService, 'deleteAccount').and.returnValue(
      throwError(() => ({
        error: { message: 'Could not delete' },
      })),
    );

    component.deleteConfirmText = 'DELETE';
    component.executeDelete();

    expect(alertSpy).toHaveBeenCalledWith('Could not delete');
  });
});
