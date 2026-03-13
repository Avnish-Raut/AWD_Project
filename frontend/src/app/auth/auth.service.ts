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
}

interface ResetPasswordDto {
  token: string;
  password: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private eventsUrl = 'http://localhost:3000/api/events';
  constructor(private http: HttpClient) {}

  register(dto: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, dto);
  }

  login(dto: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, dto).pipe(
      tap((res) => {
        // Save JWT in localStorage
        localStorage.setItem('token', res.access_token);
      }),
    );
  }
  reset(dto: ResetPasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, dto);
  }
  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, {
      email: email,
    });
  }

  getProfile() {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  getUserEvents() {
    return this.http.get(`${this.eventsUrl}/my/user-events`);
  }

  cancelRegistration(eventId: number) {
    return this.http.delete(`${this.eventsUrl}/${eventId}/cancel-registration`);
  }

  /**
   * Decodes the JWT payload and returns the user's role.
   * Returns null if no token or token is malformed.
   */
  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes the JWT payload and returns the user's ID.
   */
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
