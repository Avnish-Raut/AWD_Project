import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EventService } from '../../events/event.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-details.html',
  styleUrls: ['./event-details.scss'],
})
export class EventDetailsComponent implements OnInit {
  event: any = null;
  myEvents: any[] = [];
  loading = true;
  isProcessing = false;
  userRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.userRole = this.auth.getRole();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(eventId: string) {
    this.eventService.getEventById(eventId).subscribe((data) => {
      this.event = data;
      this.loading = false;
      this.cdr.detectChanges();
    });
    if (this.userRole === 'USER') {
      this.auth.getUserEvents().subscribe((events: any) => {
        this.myEvents = events;
        this.cdr.detectChanges();
      });
    }
  }

  isAlreadyRegistered(): boolean {
    if (!this.event || !this.myEvents) return false;
    return this.myEvents.some((e) => e.event_id === this.event.event_id);
  }

  register() {
    if (this.userRole !== 'USER') return;
    
    this.isProcessing = true;
    this.eventService.registerForEvent(this.event.event_id).subscribe({
      next: () => {
        alert('Registration Successful!');
        this.loadData(this.event.event_id.toString());
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
    });
  }

  goBack() {
    if (this.userRole === 'ORG') {
      this.router.navigate(['/organizer-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }
}