import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  message: string = '';
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['USER', Validators.required],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.error = 'Please fill in all fields correctly.';
      return;
    }

    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.message = 'Registration successful! Redirecting...';
        this.error = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.message = '';
        if (err.status === 409) {
          this.error = 'User with this email already exists.';
          this.cdr.detectChanges();
        } else {
          this.error = err.error?.message ?? 'Registration failed';
          this.cdr.detectChanges();
        }
      },
    });
  }
}
