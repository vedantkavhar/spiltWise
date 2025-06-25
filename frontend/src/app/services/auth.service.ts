import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture: string; // Ensured profilePicture is string
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  signup(username: string, email: string, password: string, ): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/signup`, {
      username,
      email,
      password,
    });
  }

  signin(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/signin`, {
      email,
      password,
    });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });
  }

  uploadProfilePicture(file: File): Observable<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const token = this.getToken();
    if (!token) {
      this.logout(); // Redirect to signin if no token
      throw new Error('No authentication token found');
    }
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/profile-picture`, formData, {
      headers: { Authorization: `Bearer ${token}` }, // Removed Content-Type to let browser set multipart/form-data
    });
  }

  saveAuthData(token: string, user: User): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  }
 
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }
 
  getUser(): User | null {
    const user = sessionStorage.getItem('user');
    return user && user !== 'null' ? JSON.parse(user) : null;
  }
 
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
 
  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/signin']);
  }
}