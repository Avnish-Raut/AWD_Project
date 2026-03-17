import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      reset: jasmine.createSpy(),
    };

    mockRouter = {
      navigate: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => 'dummy-token',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ✅ helper
  function setValidForm() {
    component.resetForm.setValue({
      password: 'Abcd1234!',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set token from query params on init', () => {
    component.ngOnInit();
    expect(component.token).toBe('dummy-token');
  });

  it('should set error if form invalid', () => {
    component.resetForm.setValue({ password: '' });

    component.onSubmit();

    expect(component.error).toContain('Password must contain at least 1 uppercase letter');
    expect(component.message).toBe('');
    expect(mockAuthService.reset).not.toHaveBeenCalled();
  });

  it('should reset password successfully and navigate', fakeAsync(() => {
    mockAuthService.reset.and.returnValue(of({}));
    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('');
    expect(component.message).toBe('Password successfully reset');

    tick(2000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle reset error with backend message', () => {
    mockAuthService.reset.and.returnValue(
      throwError(() => ({ error: { message: 'Token invalid' } })),
    );

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Token invalid');
    expect(component.message).toBe('');
  });

  it('should handle reset error with default message', () => {
    mockAuthService.reset.and.returnValue(throwError(() => ({})));

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Reset password failed');
    expect(component.message).toBe('');
  });
});
