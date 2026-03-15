import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private apiUrl = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  getPublishedEvents(filters: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters.search) params = params.append('search', filters.search);
    if (filters.location) params = params.append('location', filters.location);
    if (filters.dateFrom) params = params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params = params.append('date_to', filters.dateTo);

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getOrgEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my/events`);
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, eventData);
  }

  //Method to update existing events
  updateEvent(eventId: number, eventData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${eventId}`, eventData);
  }

  deleteEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${eventId}`);
  }

  getEventById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // --- Admin Methods ---
  getEventsForAdmin(search?: string, skip?: number, take?: number): Observable<{ data: any[], total: number }> {
    let params = new HttpParams();
    if (search) params = params.append('search', search);
    if (skip !== undefined) params = params.append('skip', skip.toString());
    if (take !== undefined) params = params.append('take', take.toString());

    return this.http.get<{ data: any[], total: number }>(`${this.apiUrl}/admin/list`, { params });
  }

  cancelEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${eventId}`);
  }

  registerForEvent(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register`, { event_id: eventId });
  }

  getParticipants(eventId: number) {
  return this.http.get<any[]>(`http://localhost:3000/api/events/${eventId}/participants`);
  }
  generateReport(eventId: number): Observable<any> {
    return this.http.post<any>(`http://localhost:3000/api/${eventId}/report/generate`, {});
  }

  getReport(reportId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/reports/${reportId}`);
  }
}
