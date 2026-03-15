import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EventService } from '../../events/event.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Added

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
  selectedFile: File | null = null; // Added

  isEditing = false;
  editForm: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient, // Injected
  ) {}

  ngOnInit() {
    this.userRole = this.auth.getRole();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadData(id);
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

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
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
    this.selectedFile = null;
  }

  saveEdit() {
    this.isProcessing = true;
    this.eventService.updateEvent(this.event.event_id, this.editForm).subscribe({
      next: (updated) => {
        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('file', this.selectedFile);
          this.http
            .post(`http://localhost:3000/api/events/${this.event.event_id}/upload`, formData)
            .subscribe({
              next: () => this.finishSave(),
              error: () => {
                alert('Details saved, but file upload failed.');
                this.finishSave();
              },
            });
        } else {
          this.finishSave();
        }
      },
      error: () => {
        alert('Update failed');
        this.isProcessing = false;
      },
    });
  }

  finishSave() {
    this.isProcessing = false;
    this.isEditing = false;
    this.router.navigate(['/organizer-dashboard']);
  }

  isAlreadyRegistered(): boolean {
    return this.myEvents.some((e) => e.event_id === this.event?.event_id);
  }

  register() {
    this.isProcessing = true;
    this.eventService.registerForEvent(this.event.event_id).subscribe(() => {
      alert('Registered!');
      this.loadData(this.event.event_id.toString());
      this.isProcessing = false;
    });
  }

  goBack() {
    this.router.navigate([this.userRole === 'ORG' ? '/organizer-dashboard' : '/user-dashboard']);
  }
  get backLink(): string {
    const role = this.auth.getRole(); 
    return role === 'ORG' ? '/organizer-dashboard' : '/events';
  }

  get backLabel(): string {
    const role = this.auth.getRole();
    return role === 'ORG' ? '← Back to Dashboard' : '← Back to Browse';
  }
}
