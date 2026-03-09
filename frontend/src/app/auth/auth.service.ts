import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role?: 'USER' | 'ORG';
}

interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: { id: number; username: string; role: string };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private _currentUser: { id: number; username: string; role: string } | null = null;

  constructor(private http: HttpClient) {}

  register(dto: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, dto);
  }

  login(dto: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, dto).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        this._currentUser = res.user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this._currentUser = null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUserId(): number | null {
    return this._currentUser?.id ?? null;
  }

  getCurrentUser(): { id: number; username: string; role: string } | null {
    return this._currentUser;
  }
}