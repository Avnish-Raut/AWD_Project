// event-details.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(eventId: string) {
    // We use "forkJoin" or simply subscribe to both
    this.eventService.getEventById(eventId).subscribe((data) => {
      this.event = data;
      this.loading = false;
      this.cdr.detectChanges();
    });

    // Fetch user's events to check registration status
    this.auth.getUserEvents().subscribe((events: any) => {
      this.myEvents = events;
      this.cdr.detectChanges();
    });
  }

  // Check if the current event ID is in the user's list
  isAlreadyRegistered(): boolean {
    if (!this.event || !this.myEvents) return false;
    return this.myEvents.some((e) => e.event_id === this.event.event_id);
  }

  register() {
    this.isProcessing = true;
    this.eventService.registerForEvent(this.event.event_id).subscribe({
      next: () => {
        alert('Registration Successful!');
        this.loadData(this.event.event_id.toString()); // Refresh status
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isProcessing = false;
        this.cdr.detectChanges();
      },
    });
  }
}
