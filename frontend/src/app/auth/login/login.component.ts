import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  message: string = '';
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.auth.login(this.loginForm.value).subscribe({
        next: () => {
          this.message = 'Login successful! Redirecting...';
          this.error = '';

          // The AuthService.login method uses tap() to save the token.
          // We now extract the role from that saved token.
          const role = this.auth.getRole(); 

          setTimeout(() => {
            // Updated to check for 'ORG' instead of 'organization'
            if (role === 'ORG') {
              this.router.navigate(['/organizer-dashboard']);
            } else {
              this.router.navigate(['/user-dashboard']);
            }
          }, 1000);
        },
        error: (err) => {
          this.error = err.error?.message ?? 'Invalid email or password';
          this.message = '';
          this.cdr.detectChanges();
        },
      });
    }
  }
}