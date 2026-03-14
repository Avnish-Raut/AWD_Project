import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EventService } from '../../events/event.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './event-details.html',
  styleUrls: ['./event-details.scss'],
})
export class EventDetailsComponent implements OnInit {
  event: any = null;
  myEvents: any[] = [];
  loading = true;
  isProcessing = false;
  userRole: string | null = null;

  // EDIT STATE
  isEditing = false;
  editForm: any = {};

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

  startEdit() {
    this.isEditing = true;
    this.editForm = { ...this.event };
    if (this.editForm.event_date) {
      this.editForm.event_date = new Date(this.editForm.event_date).toISOString().split('T')[0];
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.editForm = {};
  }

  saveEdit() {
    this.isProcessing = true;
    this.eventService.updateEvent(this.event.event_id, this.editForm).subscribe({
      next: (updated) => {
        this.event = updated;
        this.isEditing = false;
        this.isProcessing = false;
        this.router.navigate(['/organizer-dashboard']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update failed', err);
        alert('Failed to update event.');
        this.isProcessing = false;
        this.cdr.detectChanges();
      }
    });
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