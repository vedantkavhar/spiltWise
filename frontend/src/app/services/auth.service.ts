import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture: string;
  emailNotifications?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  signup(username: string, email: string, password: string): Observable<{ accessToken: string; user: User }> {
    return this.http
      .post<{ accessToken: string; user: User }>(
        `${this.apiUrl}/signup`,
        { username, email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.saveAuthData(response.accessToken, response.user)),
        catchError((err) => {
          console.error('Signup error:', err);
          return throwError(() => err);
        })
      );
  }

  signin(email: string, password: string): Observable<{ accessToken: string; user: User }> {
    return this.http
      .post<{ accessToken: string; user: User }>(
        `${this.apiUrl}/signin`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.saveAuthData(response.accessToken, response.user)),
        catchError((err) => {
          console.error('Signin error:', err);
          return throwError(() => err);
        })
      );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http
      .post<{ accessToken: string }>(
        `${this.apiUrl}/refresh-token`,
        {},
        { withCredentials: true }
      )
      .pipe(
        catchError((err) => {
          this.logout();
          this.router.navigate(['/signin']);
          return throwError(() => err);
        })
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  uploadProfilePicture(file: File): Observable<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const token = this.getToken();
    if (!token) {
      this.logout();
      throw new Error('No authentication token found');
    }
    return this.http.post<{ message: string; user: User }>(
      `${this.apiUrl}/profile-picture`,
      formData
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http
        .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
        .subscribe({
          next: () => {
            this.clearAuthData();
            this.router.navigate(['/signin']);
          },
          error: (err) => {
            console.error('Logout error:', err);
            this.clearAuthData();
            this.router.navigate(['/signin']);
          },
        });
    } else {
      this.clearAuthData();
      this.router.navigate(['/signin']);
    }
  }

  saveAuthData(accessToken: string, user: User): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  updateAccessToken(accessToken: string): void {
    localStorage.setItem('accessToken', accessToken);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user && user !== 'null' ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
}
