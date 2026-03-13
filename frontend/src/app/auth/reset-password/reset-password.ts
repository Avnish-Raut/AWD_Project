import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  message: string = '';
  error: string = '';
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  onSubmit() {
    this.resetForm.markAllAsTouched();

    if (this.resetForm.valid) {
      const payload = {
        token: this.token,
        password: this.resetForm.value.password,
      };

      this.auth.reset(payload).subscribe({
        next: () => {
          this.error = '';
          this.message = 'Password successfully reset';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },

        error: (err) => {
          this.error = err.error?.message ?? 'Reset password failed';
          this.message = '';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.error =
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character';
      this.cdr.detectChanges();
    }
  }
}
