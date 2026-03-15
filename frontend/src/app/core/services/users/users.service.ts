import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: 'USER' | 'ORG' | 'ADMIN';
  created_at: string;
  deleted_at: string | null;
}

export interface UsersResponse {
  data: User[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(search?: string, skip?: number, take?: number): Observable<UsersResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    
    return this.http.get<UsersResponse>(this.apiUrl, { params });
  }

  updateUserRole(userId: number, role: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role });
  }

  deactivateUser(userId: number): Observable<{ message: string, user_id: number }> {
    return this.http.delete<{ message: string, user_id: number }>(`${this.apiUrl}/${userId}`);
  }

  reactivateUser(userId: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${userId}/reactivate`, {});
  }
}
