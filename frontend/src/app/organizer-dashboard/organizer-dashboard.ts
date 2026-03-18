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
  reportProgress: { [key: number]: number } = {};
  isGeneratingReport: { [key: number]: boolean } = {};
  reportResults: { [key: number]: any } = {};

  constructor(
    private auth: AuthService,
    private eventService: EventService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
      error: () => this.router.navigate(['/login']),
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
      },
    });
  }

  generateReport(eventId: number) {
    if (this.isGeneratingReport[eventId]) return;

    this.isGeneratingReport[eventId] = true;
    this.reportProgress[eventId] = 0;
    this.cdr.detectChanges();

    this.eventService.generateReport(eventId).subscribe({
      next: (response: any) => {
        const reportId = response.report_id || response.id || eventId;
        this.trackReportProgress(eventId, reportId);
      },
      error: (err: any) => {
        console.error('Failed to start report generation:', err);
        this.isGeneratingReport[eventId] = false;
        this.cdr.detectChanges();
        alert('Failed to start report generation.');
      },
    });
  }

  trackReportProgress(eventId: number, reportId: number) {
    const token = localStorage.getItem('token');

    const eventSource = new EventSource(
      `http://localhost:3000/api/reports/${reportId}/progress?token=${token}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log(`Report Progress [${eventId}]:`, data);

        if (data.progress !== undefined) {
          this.reportProgress[eventId] = data.progress;
          this.cdr.detectChanges();
        }

        if (data.status === 'DONE' || data.progress >= 100) {
          eventSource.close();
          this.isGeneratingReport[eventId] = false;
          this.reportProgress[eventId] = 100;
          this.cdr.detectChanges();

          // Automatically fetch the completed report to display the results!
          this.eventService.getReport(reportId).subscribe({
            next: (res) => {
              if (res && res.result_data) {
                this.reportResults[eventId] = res.result_data;
                this.cdr.detectChanges();
              }
            },
          });

          setTimeout(() => {
            alert(`Report generated successfully!`);
          }, 500);
        }
      } catch (e) {
        console.error('Error parsing SSE message', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
      this.isGeneratingReport[eventId] = false;
      this.cdr.detectChanges();
    };
  }

  deleteEvent(eventId: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          this.myHostedEvents = this.myHostedEvents.filter((e) => e.event_id !== eventId);
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Delete failed:', err),
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
