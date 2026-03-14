import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { EventService } from '../events/event.service';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss'],
})
export class OrganizerDashboardComponent implements OnInit {
  user: any = null;
  myHostedEvents: any[] = [];
  loading = true;

  constructor(
    private auth: AuthService,
    private eventService: EventService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (data: any) => {
        this.user = data;
        if (this.user.role !== 'ORG') { 
          this.router.navigate(['/user-dashboard']);
          return;
        }
        this.loadHostedEvents();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  loadHostedEvents() {
    this.eventService.getOrgEvents().subscribe({
      next: (data: any[]) => {
        this.myHostedEvents = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteEvent(eventId: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          this.myHostedEvents = this.myHostedEvents.filter(e => e.event_id !== eventId);
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Delete failed:', err)
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}