import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService, Log } from '../../../core/services/logs/logs.service';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './system-logs.html',
  styleUrl: './system-logs.scss',
})
export class SystemLogs implements OnInit {
  logs: Log[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Filters
  selectedLevel: string = 'ALL';
  levels: string[] = ['ALL', 'INFO', 'WARN', 'ERROR'];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 15; // Slightly larger page size for logs
  totalLogs: number = 0;

  constructor(
    private logsService: LogsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    const offset = (this.currentPage - 1) * this.pageSize;
    
    this.logsService.getLogs(this.selectedLevel, offset, this.pageSize).subscribe({
      next: (response: any) => {
        this.logs = response.logs;
        this.totalLogs = response.total;
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load logs', err);
        this.error = 'Failed to load system logs';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalLogs) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
