import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      register: jasmine.createSpy(),
    };

    mockRouter = {
      navigate: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setValidForm() {
    component.registerForm.setValue({
      username: 'test',
      email: 'test@test.com',
      password: '12345678',
      role: 'USER',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error if form is invalid', () => {
    component.registerForm.setValue({
      username: '',
      email: '',
      password: '',
      role: '',
    });

    component.onSubmit();

    expect(component.error).toBe('Please fill in all fields correctly.');
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should register and navigate to login on success', fakeAsync(() => {
    mockAuthService.register.and.returnValue(of({}));

    setValidForm();

    component.onSubmit();

    expect(component.message).toContain('Registration successful');
    expect(component.error).toBe('');

    tick(3000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle 409 error (user exists)', () => {
    mockAuthService.register.and.returnValue(throwError(() => ({ status: 409 })));

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('User with this email already exists.');
    expect(component.message).toBe('');
  });

  it('should handle error with backend message', () => {
    mockAuthService.register.and.returnValue(
      throwError(() => ({
        error: { message: 'Custom error' },
      })),
    );

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Custom error');
  });

  it('should handle error with default message', () => {
    mockAuthService.register.and.returnValue(throwError(() => ({})));

    setValidForm();

    component.onSubmit();

    expect(component.error).toBe('Registration failed');
  });
});
