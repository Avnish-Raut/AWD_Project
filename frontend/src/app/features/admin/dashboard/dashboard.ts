import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService, AdminStats } from '../../../core/services/statistics.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  stats: AdminStats | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.statisticsService.getAdminStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force Angular to update the template
      },
      error: (err) => {
        console.error('Failed to load admin stats', err);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
        this.cdr.detectChanges(); // Force Angular to update the template
      }
    });
  }
}
