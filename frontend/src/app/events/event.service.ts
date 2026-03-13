// event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private apiUrl = 'http://localhost:3000/api/events'; // Match your NestJS route

  constructor(private http: HttpClient) {}

  getPublishedEvents(filters: any): Observable<any[]> {
    let params = new HttpParams();

    if (filters.search) params = params.append('search', filters.search);
    if (filters.location) params = params.append('location', filters.location);
    if (filters.dateFrom) params = params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params = params.append('date_to', filters.dateTo);

    return this.http.get<any[]>(this.apiUrl, { params });
  }
}
