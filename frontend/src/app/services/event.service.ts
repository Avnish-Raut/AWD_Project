import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateEventPayload {
  title: string;
  location: string;
  event_date: string;
  description?: string;
  capacity: number;
}

export interface EventItem {
  event_id: number;
  title: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiUrl = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  createEvent(payload: CreateEventPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  getEventsByUser(userId?: number): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(`${this.apiUrl}/my/events`);
  }
}