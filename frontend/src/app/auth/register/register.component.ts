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
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  registerForm: FormGroup;
  message: string = '';
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['USER', Validators.required]
    });

  }

  onSubmit() {

    this.registerForm.markAllAsTouched();

    if (this.registerForm.valid) {

      this.auth.register(this.registerForm.value).subscribe({

        next: () => {
          this.message = 'Registration successful! Please log in.';
          this.error = '';
          this.cd.detectChanges();

          this.router.navigate(['/login']);
        },

        error: (err) => {

          if (err.status === 409) {
            this.error = 'User with this email already exists.';
          } else {
            this.error = err.error?.message ?? 'Registration failed';
          }

          this.message = '';
          this.cd.detectChanges();
        }

      });

    } else {
      this.error = 'Please fill in all fields correctly.';
      this.cd.detectChanges();
    }
  }

}