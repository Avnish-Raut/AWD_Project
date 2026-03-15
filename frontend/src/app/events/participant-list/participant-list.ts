import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EventService } from '../event.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './participant-list.html',
  styleUrls: ['./participant-list.scss'],
})
export class ParticipantListComponent implements OnInit {
  participants: any[] = [];
  eventId: number = 0;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId = +id;
      this.loadParticipants();
    }
  }

  loadParticipants() {
    this.eventService.getParticipants(this.eventId).subscribe({
      next: (data) => {
        this.participants = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load participants', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
