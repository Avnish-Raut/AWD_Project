import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(
    private http: HttpClient,
    // private cdr: ChangeDetectorRef,
  ) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/me`, data);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me`);
  }

  // frontend/src/app/services/user.service.ts

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    // Endpoint matches your R37 @Post('me/avatar')
    return this.http.post(`${this.apiUrl}/me/avatar`, formData);
  }

  deleteAvatar(): Observable<any> {
    // Endpoint matches your R37 @Delete('me/avatar')
    //this.cdr.detectChanges();
    return this.http.delete(`${this.apiUrl}/me/avatar`);
  }
}
