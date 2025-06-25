import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ExpenseService, Expense, Category } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseOperationsService {
  constructor(
    private expenseService: ExpenseService,
    private toastService: ToastService
  ) {}

  loadCategories(): Observable<Category[]> {
    return this.expenseService.getCategories();
  }

  loadExpenses(period: string): Observable<Expense[]> {
    return this.expenseService.getExpenses(period);
  }

  addExpense(formExpense: Partial<Expense>): Observable<Expense> {
    if (
      !formExpense.description ||
      !formExpense.amount ||
      (!formExpense.category && formExpense.type === 'Expense')
    ) {
      throw new Error('Description, amount, and category are required');
    }
    if (!formExpense.date) {
      formExpense.date = new Date().toISOString();
    }
    return this.expenseService.addExpense(formExpense);
  }

  prepareEditExpense(expense: Expense): Partial<Expense> {
    return {
      ...expense,
      date: new Date(expense.date).toISOString().split('T')[0],
    };
  }

  updateExpense(id: string, formExpense: Partial<Expense>): Observable<Expense> {
    return this.expenseService.updateExpense(id, formExpense);
  }

  updateLocalExpenses(expenses: Expense[], updatedExpense: Expense): Expense[] {
    const index = expenses.findIndex((e) => e._id === updatedExpense._id);
    if (index !== -1) {
      expenses[index] = updatedExpense;
    }
    return expenses;
  }

  deleteExpense(expenseId: string): Observable<void> {
    return this.expenseService.deleteExpense(expenseId).pipe(map(()=>{}));
  }
}