import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../event.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-event.html',
  styleUrls: ['./create-event.scss']
})
export class CreateEventComponent {
  eventForm: FormGroup;
  submitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      location: ['', [Validators.required]],
      event_date: ['', [Validators.required]],
      capacity: [10, [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      this.submitting = true;
      this.eventService.createEvent(this.eventForm.value).subscribe({
        next: () => {
          alert('Event created successfully!');
          this.router.navigate(['/organizer-dashboard']);
        },
        error: (err) => {
          this.errorMessage = 'Failed to create event. Please try again.';
          this.submitting = false;
          console.error(err);
        }
      });
    }
  }
}