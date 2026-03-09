import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EventCreateFormComponent } from './event-create-form/event-create-form.component';
import { ReportProgressComponent } from './report-progress/report-progress.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, EventCreateFormComponent, ReportProgressComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'], // <-- add this
})
export class DashboardComponent {}