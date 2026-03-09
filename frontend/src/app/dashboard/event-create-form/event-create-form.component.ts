import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, CreateEventPayload } from '../../services/event.service';

@Component({
  selector: 'app-event-create-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-create-form.component.html',
})
export class EventCreateFormComponent {
  eventForm: FormGroup;
  message: string = '';
  error: string = '';

  constructor(private fb: FormBuilder, private eventService: EventService) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      location: ['', Validators.required],
      event_date: ['', Validators.required],
      description: [''],
      capacity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      const payload: CreateEventPayload = {
        title: this.eventForm.value.title!,
        location: this.eventForm.value.location!,
        event_date: this.eventForm.value.event_date!,
        description: this.eventForm.value.description || '',
        capacity: this.eventForm.value.capacity!,
      };

      this.eventService.createEvent(payload).subscribe({
        next: () => {
          this.message = 'Event created successfully!';
          this.error = '';
          this.eventForm.reset();
        },
        error: (err) => {
          this.error = err.error?.message ?? 'Event creation failed';
          this.message = '';
        },
      });
    } else {
      this.error = 'Please fill in all required fields correctly.';
    }
  }
}