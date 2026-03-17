import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile', 'deleteAccount', 'uploadAvatar', 'deleteAvatar']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { params: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    
    // Mock basic user profile
    mockUserService.getProfile.and.returnValue(of({
      username: 'testuser',
      email: 'test@example.com',
      avatar_url: 'avatar.png'
    }));
  });

  it('should create and load profile on init', () => {
    fixture.detectChanges();
    
    expect(component).toBeTruthy();
    expect(mockUserService.getProfile).toHaveBeenCalled();
    expect(component.user.username).toBe('testuser');
    expect(component.loading).toBeFalse();
  });

  it('should update profile successfully', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    spyOn(component, 'reloadPage').and.stub();
    mockUserService.updateProfile.and.returnValue(of({ username: 'newname' }));
    
    component.updateDto.new_password = 'NewPassword123!';
    component.updateDto.current_password = 'OldPassword123!';
    
    component.onUpdateProfile();
    
    expect(mockUserService.updateProfile).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Profile updated!');
    expect(component.user.username).toBe('newname');
  });

  it('should show delete confirm modal', () => {
    fixture.detectChanges();
    
    component.confirmDelete();
    
    expect(component.showDeleteModal).toBeTrue();
    expect(component.deleteConfirmText).toBe('');
  });

  it('should execute delete when confirm text is correct', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    mockUserService.deleteAccount.and.returnValue(of({ message: 'Deleted' }));
    
    component.deleteConfirmText = 'DELETE';
    component.executeDelete();
    
    expect(mockUserService.deleteAccount).toHaveBeenCalled();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should upload avatar successfully on file select', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    const mockEvent = { target: { files: [mockFile] } };
    
    mockUserService.uploadAvatar.and.returnValue(of({ avatar_url: 'new-avatar.png' }));
    
    component.onFileSelected(mockEvent);
    
    expect(mockUserService.uploadAvatar).toHaveBeenCalledWith(mockFile);
    expect(component.user.avatar_url).toBe('new-avatar.png');
    expect(window.alert).toHaveBeenCalledWith('Avatar uploaded successfully!');
  });
});
