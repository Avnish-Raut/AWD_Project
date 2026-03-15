import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EventService } from './event.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-browse-events',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './events.html',
  styleUrls: ['./events.scss'],
})
export class BrowseEventsComponent implements OnInit {
  events: any[] = [];
  searchFilters = { search: '', location: '', dateFrom: '', dateTo: '' };

  constructor(
    private eventService: EventService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fetchEvents();
  }

  backToDashboard() {
    const role = this.auth.getRole();
    if (role === 'ORG') {
      this.router.navigate(['/organizer-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  fetchEvents() {
    this.eventService.getPublishedEvents(this.searchFilters).subscribe({
      next: (data) => {
        this.events = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.cdr.detectChanges();
      },
    });
  }

  onFilterChange() {
    this.fetchEvents();
    this.cdr.detectChanges();
  }
}