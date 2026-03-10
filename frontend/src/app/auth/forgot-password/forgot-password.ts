import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  message: string = '';
  error: string = '';
  loading: boolean = false;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.loading) return; // prevents second click

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true; // disable button
    this.message = '';
    this.error = '';

    const email = this.forgotForm.value.email;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.message = 'Password reset email sent. Check your inbox.';

        setTimeout(() => {
          this.loading = true;
        }, 1);
      },

      error: (err) => {
        this.error = err.error?.message ?? 'Failed to send reset email';
        this.loading = false;
      },
    });
  }
}
