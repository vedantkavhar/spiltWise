import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  userId: string;
  category: string;
  type: string;
}

export interface Category {
  _id: string;
  name: string;
}

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

  constructor(private http: HttpClient, private authService: AuthService) {}

  getExpenses(category?: string): Observable<Expense[]> {
    const url = category && category !== 'All' ? `${this.apiUrl}?category=${category}` : this.apiUrl;
    return this.http.get<Expense[]>(url);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrls);
  }

  getExpenseSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`);
  }

  addExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
  }

  deleteExpense(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
