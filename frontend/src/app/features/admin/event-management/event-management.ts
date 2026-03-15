import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { EventService } from "../../../events/event.service";

@Component({
  selector: "app-event-management",
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: "./event-management.html",
  styleUrl: "./event-management.scss",
})
export class EventManagement implements OnInit {
  events: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchQuery: string = "";
  
  currentPage: number = 1;
  pageSize: number = 10;
  totalEvents: number = 0;

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    const skip = (this.currentPage - 1) * this.pageSize;
    
    this.eventService.getEventsForAdmin(this.searchQuery, skip, this.pageSize).subscribe({
      next: (response: any) => {
        this.events = response.data;
        this.totalEvents = response.total;
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Failed to load events", err);
        this.error = "Failed to load events";
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadEvents();
  }

  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalEvents) {
      this.currentPage++;
      this.loadEvents();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEvents();
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  cancelEvent(event: any): void {
    if (confirm(`Are you sure you want to cancel the event "${event.title}"?`)) {
      this.eventService.cancelEvent(event.event_id).subscribe({
        next: () => {
          event.is_cancelled = true;
          event.is_published = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          alert("Failed to cancel event");
          console.error(err);
        }
      });
    }
  }
}
