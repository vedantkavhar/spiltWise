import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
// User interface representing the authenticated user
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
  // Base URL for authentication endpoints
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Registers a new user and returns a token and user object
  signup(username: string, email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/signup`, {
      username,
      email,
      password,
    });
  }

  // Authenticates a user and returns a token and user object
  signin(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/signin`, {
      email,
      password,
    });
  }

  // Retrieves the authenticated user's profile from the backend
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });
  }

  // Uploads a new profile picture for the user
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

  // Saves authentication token and user info to sessionStorage
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

  // Checks if the user is authenticated (token exists)
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/signin']);
  }
}
