import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      forgotPassword: jasmine.createSpy(),
    };

    mockRouter = {
      navigate: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setValidForm() {
    component.forgotForm.setValue({
      email: 'test@test.com',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if already loading', () => {
    component.loading = true;

    component.onSubmit();

    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
  });

  it('should mark form touched if invalid', () => {
    component.forgotForm.setValue({
      email: '',
    });

    spyOn(component.forgotForm, 'markAllAsTouched');

    component.onSubmit();

    expect(component.forgotForm.markAllAsTouched).toHaveBeenCalled();
    expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
  });

  it('should send reset email successfully', fakeAsync(() => {
    mockAuthService.forgotPassword.and.returnValue(of({}));

    setValidForm();

    component.onSubmit();

    expect(component.loading).toBeTrue();
    expect(component.message).toBe('Password reset email sent. Check your inbox.');
    expect(component.error).toBe('');

    tick(1);

    expect(component.loading).toBeTrue();
  }));

  it('should handle error with backend message', () => {
    mockAuthService.forgotPassword.and.returnValue(
      throwError(() => ({
        error: { message: 'User not found' },
      })),
    );

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('User not found');
    expect(component.loading).toBeFalse();
  });

  it('should handle error with default message', () => {
    mockAuthService.forgotPassword.and.returnValue(throwError(() => ({})));

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Failed to send reset email');
    expect(component.loading).toBeFalse();
  });
});
