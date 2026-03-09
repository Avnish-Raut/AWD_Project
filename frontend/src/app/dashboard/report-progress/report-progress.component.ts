import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, EventItem } from '../../services/event.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-report-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-progress.component.html',
})
export class ReportProgressComponent {
  events: EventItem[] = [];
  selectedEventId: number | null = null;
  statusMessage = '';
  progressValue = 0;

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) {
    this.loadEvents();
  }

  loadEvents() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.eventService.getEventsByUser(userId).subscribe((e: EventItem[]) => {
        this.events = e;
      });
    }
  }

  generateReport() {
    if (!this.selectedEventId) return;

    this.statusMessage = 'Generating... (do not close)';
    this.progressValue = 0;

    const interval = setInterval(() => {
      this.progressValue += 10;
      if (this.progressValue >= 100) {
        clearInterval(interval);
        this.statusMessage = 'Report generation completed!';
      }
    }, 200);
  }

  status() {
    return this.statusMessage;
  }

  progress() {
    return this.progressValue;
  }
}