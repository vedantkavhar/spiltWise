import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Expense interface representing a single expense record
export interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  userId: string;
  category: string;
  type: string;
}
// Category interface representing an expense category
export interface Category {
  _id: string;
  name: string;
}

// ExpenseSummary interface for summary data (used in reports/charts)
export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: { type: string; category: string; total: number; count: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;
  private apiUrls = `${environment.apiUrl}/categories`;
  // private apiUrls = 'http://localhost:5000/api/categories'; // your backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}
  // Helper method to get HTTP headers with JWT token for authentication
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
// Fetches expenses from the backend, optionally filtered by category
  // getExpenses(category?: string): Observable<Expense[]> {
  //   const url = category && category !== 'All' ? `${this.apiUrl}?category=${category}` : this.apiUrl;
  //   return this.http.get<Expense[]>(url, { headers: this.getHeaders() });
  // }

// Fetches expenses from the backend with filtering, search, sort, and pagination
getExpenses(options?: {
  category?: string;
  type?: string;
  period?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Observable<{ expenses: Expense[]; total: number }> {
  let params: any = {};
  if (options) {
    if (options.category) params.category = options.category;
    if (options.type) params.type = options.type;
    if (options.period) params.period = options.period;
    if (options.search) params.search = options.search;
    if (options.sort) params.sort = options.sort;
    if (options.page) params.page = options.page;
    if (options.pageSize) params.pageSize = options.pageSize;

  }
  return this.http.get<{ expenses: Expense[]; total: number }>(this.apiUrl, {
    headers: this.getHeaders(),
    params,
  });
}

  // Fetches all available categories from the backend
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrls);
  }

  // Fetches a summary of expenses for the authenticated user
  getExpenseSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`, { headers: this.getHeaders() });
  }
  // Adds a new expense for the authenticated user
  addExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense, { headers: this.getHeaders() });
  }
  // Updates an existing expense by ID
  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense, { headers: this.getHeaders() });
  }
  // Deletes an expense by ID
  deleteExpense(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
