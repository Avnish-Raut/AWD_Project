import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss'],
})
export class UserDashboardComponent implements OnInit {
  user: any = null;
  myEvents: any[] = [];

  message = '';
  error = '';
  cancellingId: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Load logged-in user profile
    this.auth.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        //  console.error('Profile Load Failed:', err);
        this.router.navigate(['/login']);
      },
    });

    // Load events the user registered for
    this.auth.getUserEvents().subscribe({
      next: (events: any) => {
        this.myEvents = events;
        this.cdr.detectChanges();
      },
    });
  }

  cancelRegistration(eventId: number) {
    // 1. Show the confirmation box
    const userConfirmed = confirm(
      'Are you sure you want to cancel your registration for this event?',
    );

    // 2. Only proceed if they clicked 'OK'
    if (userConfirmed) {
      this.cancellingId = eventId;

      this.auth.cancelRegistration(eventId).subscribe({
        next: () => {
          this.cancellingId = null;
          alert('Registration successfully cancelled.'); // Success feedback
          this.auth.getUserEvents();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cancellingId = null;
          console.error(err);
          this.cdr.detectChanges();
        },
      });
    } else {
      // User clicked 'Cancel' in the alert box
      console.log('Cancellation aborted by user.');
      this.cdr.detectChanges();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
