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
        console.error('Profile Load Failed:', err);
        //this.router.navigate(['/login']);
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
    this.auth.cancelRegistration(eventId).subscribe({
      next: () => {
        this.message = 'Registration cancelled';

        this.myEvents = this.myEvents.filter((e) => e.event_id !== eventId);
      },

      error: () => {
        this.error = 'Could not cancel registration';
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
