import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Expense, Category } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';
import { ExpenseOperationsService } from './expense-operations.service';
import { ExpenseFilterService } from './expense-filter.service';
import { ExpenseExportService } from './expense-export.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  user: User | null = null;
  expenses: Expense[] = [];
  originalExpenses: Expense[] = [];
  formExpense: Partial<Expense> = {
    date: '',
    type: 'Expense',
    description: '',
    amount: 0,
    category: 'Other',
  };
  editingExpense: Expense | null = null;
  error: string = '';
  categories: Category[] = [];
  loading: boolean = false;
  selectedCategory: string = 'All';
  selectedPeriod: string = 'All';
  searchQuery: string = '';
  sortOption: string = 'date-asc';
  pageSizeOptions: number[] = [5, 10, 20, 50];
  currentPage: number = 1;
  pageSize: number = 5;
  filteredExpenses: Expense[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private expenseOperations: ExpenseOperationsService,
    private expenseFilter: ExpenseFilterService,
    private expenseExport: ExpenseExportService,
    private toastService: ToastService
  ) {
    this.user = this.authService.getUser();
    if (!this.user) {
      this.router.navigate(['/signin']);
    } else {
      this.loadCategories();
      this.loadExpenses();
    }
  }

  loadCategories(): void {
    this.expenseOperations.loadCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Failed to load categories';
        this.toastService.show(errorMessage, 'error');
        console.error('Error loading categories:', err);
      }
    });
  }

  loadExpenses(): void {
    this.expenseOperations.loadExpenses('All').subscribe({
      next: (expenses) => {
        this.originalExpenses = expenses;
        this.filterExpenses();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load expenses';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  filterExpenses(resetPage: boolean = false): void {
    const result = this.expenseFilter.filterExpenses(
      this.originalExpenses,
      this.selectedCategory,
      this.selectedPeriod,
      this.searchQuery,
      this.sortOption,
      this.currentPage,
      this.pageSize,
      resetPage
    );
    this.filteredExpenses = result.filteredExpenses;
    this.expenses = result.paginatedExpenses;
    if (resetPage) this.currentPage = 1;
  }

  addExpense(): void {
    this.expenseOperations.addExpense(this.formExpense).subscribe({
      next: () => {
        this.loadExpenses();
        this.resetForm();
        this.toastService.show('Expense added successfully', 'success');
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add expense';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  editExpense(expense: Expense): void {
    this.editingExpense = expense;
    this.formExpense = this.expenseOperations.prepareEditExpense(expense);
  }

  updateExpense(): void {
    if (!this.editingExpense || !this.editingExpense._id) return;
    this.expenseOperations.updateExpense(this.editingExpense._id, this.formExpense).subscribe({
      next: (updatedExpense) => {
        this.originalExpenses = this.expenseOperations.updateLocalExpenses(
          this.originalExpenses,
          updatedExpense
        );
        this.filterExpenses();
        this.resetForm();
        this.editingExpense = null;
        this.toastService.show('Expense updated successfully', 'success');
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update expense';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  deleteExpense(expenseId: string): void {
    this.expenseOperations.deleteExpense(expenseId).subscribe({
      next: () => {
        this.originalExpenses = this.originalExpenses.filter((e) => e._id !== expenseId);
        this.filterExpenses();
        this.toastService.show('Expense deleted successfully', 'success');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete expense';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  resetForm(): void {
    this.formExpense = {
      date: '',
      type: 'Expense',
      description: '',
      amount: 0,
      category: 'Other',
    };
    this.editingExpense = null;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  logout(): void {
    this.authService.logout();
    this.toastService.show('Logged out successfully', 'success');
    setTimeout(() => {
      this.router.navigate(['/signin']);
    }, 2000);
  }

  getTotalExpenses(): number {
    return this.expenseFilter.getTotalExpenses(this.expenses);
  }

  downloadPDF(): void {
    this.expenseExport.downloadPDF(this.expenses);
    this.toastService.show('PDF downloaded successfully!', 'success');
  }

  downloadExcel(): void {
    this.expenseExport.downloadExcel(this.expenses);
    this.toastService.show('Excel downloaded successfully!', 'info');
  }

  onPageSizeChange(): void {
    this.filterExpenses(true);
  }

  get totalPages(): number {
    return this.expenseFilter.getTotalPages(this.filteredExpenses, this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.filterExpenses();
  }
}
