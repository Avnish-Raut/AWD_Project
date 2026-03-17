import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
//import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jasmine.createSpy(),
      getRole: jasmine.createSpy(),
    };

    mockRouter = {
      navigate: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setValidForm() {
    component.loginForm.setValue({
      email: 'test@test.com',
      password: '12345678',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT call login if form invalid', () => {
    component.loginForm.setValue({
      email: '',
      password: '',
    });

    component.onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should login and navigate ADMIN', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of({}));
    mockAuthService.getRole.and.returnValue('ADMIN');

    setValidForm();

    component.onSubmit();
    tick(1000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  }));

  it('should login and navigate ORG', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of({}));
    mockAuthService.getRole.and.returnValue('ORG');

    setValidForm();

    component.onSubmit();
    tick(1000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/organizer-dashboard']);
  }));

  it('should login and navigate USER (default)', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of({}));
    mockAuthService.getRole.and.returnValue('USER');

    setValidForm();

    component.onSubmit();
    tick(1000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-dashboard']);
  }));

  it('should fallback to USER dashboard if role null', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of({}));
    mockAuthService.getRole.and.returnValue(null);

    setValidForm();

    component.onSubmit();
    tick(1000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-dashboard']);
  }));

  it('should handle login error with backend message', () => {
    mockAuthService.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Invalid credentials');
    expect(component.message).toBe('');
  });

  it('should handle login error with default message', () => {
    mockAuthService.login.and.returnValue(throwError(() => ({})));

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Invalid email or password');
  });
});
