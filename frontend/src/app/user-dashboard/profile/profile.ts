import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements AfterViewInit {
  // Data containers
  user: any = {};
  updateDto: any = {
    current_password: '',
    new_password: '',
  };
  readonly IMAGE_BASE_URL = 'http://localhost:3000';

  // UI State
  loading = true;
  showDeleteModal = false;
  deleteConfirmText = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit() {
    this.loadProfile();
    this.cdr.detectChanges();
  }

  loadProfile() {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
        console.log('Profile loaded:', this.user);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
  reloadPage(): void {
    window.location.reload();
  }
  onUpdateProfile() {
    // 1. Create a clean base payload
    const payload: any = {
      username: this.user.username,
      email: this.user.email,
      avatar_url: this.user.avatar_url,
    };

    // 2. Only add password fields if the user actually typed a NEW password
    if (this.updateDto.new_password && this.updateDto.new_password.trim() !== '') {
      payload.current_password = this.updateDto.current_password;
      payload.new_password = this.updateDto.new_password;
    }

    this.userService.updateProfile(payload).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        alert('Profile updated!');
        this.updateDto = { current_password: '', new_password: '' };
        this.reloadPage();
      },
      error: (err) => {
        // NestJS ValidationPipe returns errors in an array called 'message'
        if (err.status === 400 && Array.isArray(err.error.message)) {
          alert(err.error.message.join('\n')); // Shows all validation errors
        } else {
          alert(err.error?.message || 'Update failed');
        }
      },
    });
  }

  confirmDelete() {
    this.showDeleteModal = true;
    this.deleteConfirmText = '';
    this.cdr.detectChanges();
  }

  executeDelete() {
    if (this.deleteConfirmText === 'DELETE') {
      this.userService.deleteAccount().subscribe({
        next: (res) => {
          alert(res.message);
          this.showDeleteModal = false;
          this.authService.logout(); // Clear tokens
          this.router.navigate(['/login']); // Redirect
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.message || 'Error deleting account');
          this.cdr.detectChanges();
        },
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.loading = true;
      this.userService.uploadAvatar(file).subscribe({
        next: (updatedUser) => {
          this.user.avatar_url = updatedUser.avatar_url;
          this.loading = false;
          alert('Avatar uploaded successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          alert(err.error?.message || 'Upload failed');
          this.cdr.detectChanges();
        },
      });
    }
  }

  removeAvatar() {
    if (confirm('Are you sure you want to remove your profile picture?')) {
      this.userService.deleteAvatar().subscribe({
        next: (updatedUser) => {
          this.user.avatar_url = null;
          alert('Avatar removed.');
          this.cdr.detectChanges();
          this.reloadPage();
        },
        error: (err) => {
          alert('Delete failed');
          this.cdr.detectChanges();
        },
      });
    }
  }
}
