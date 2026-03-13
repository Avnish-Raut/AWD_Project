import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EventService } from './event.service';
import { RouterModule } from '@angular/router';
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

  searchFilters = {
    search: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  };

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fetchEvents();
  }

  fetchEvents() {
    this.eventService.getPublishedEvents(this.searchFilters).subscribe({
      next: (data) => {
        this.events = data;
        this.cdr.detectChanges();
        //console.log('Events loaded:', data);
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.cdr.detectChanges();
      },
    });
  }

  // Called on every keystroke or when 'Search' button is clicked
  onFilterChange() {
    this.fetchEvents();
    this.cdr.detectChanges();
  }
}
