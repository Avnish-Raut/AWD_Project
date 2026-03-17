import { Component, OnInit, ChangeDetectorRef, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CalendarOptions } from '@fullcalendar/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Injectable({ providedIn: 'root' })
export class ReloadService {
  reload(): void {
    window.location.reload();
  }
}
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FullCalendarModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss'],
})
export class UserDashboardComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek',
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
  };

  user: any = null;
  myEvents: any[] = [];

  message = '';
  error = '';
  cancellingId: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private reloadService: ReloadService,
  ) {}

  reloadPage(): void {
    this.reloadService.reload();
  }
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
    this.loadUserEvents();
  }

  loadUserEvents() {
    this.auth.getUserEvents().subscribe({
      next: (events: any) => {
        // Map your backend data to FullCalendar's structure
        this.calendarOptions.events = events.map((event: any) => ({
          title: event.title,
          start: event.event_date,
          id: event.event_id,
          backgroundColor: '#6366f1', // You can customize colors based on event type
          borderColor: '#4f46e5',
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Could not load events for calendar', err),
    });
  }

  handleEventClick(arg: any) {
    this.router.navigate(['/events', arg.event.id]);
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
          this.reloadPage();
        },
        error: (err) => {
          this.cancellingId = null;
          // console.error(err);
          this.cdr.detectChanges();
        },
      });
    } else {
      // User clicked 'Cancel' in the alert box
      //console.log('Cancellation aborted by user.');
      this.cdr.detectChanges();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
