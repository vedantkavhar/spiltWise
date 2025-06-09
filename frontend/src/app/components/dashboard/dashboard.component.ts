import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Category, Expense, ExpenseService } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  user: { id: string; username: string; email: string } | null = null;
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

  selectedCategory: string = 'All';
  selectedPeriod: string = 'All';
  // Added property for search query
  searchQuery: string = '';
  // Added property for sort option, defaulting to newest first
  sortOption: string = 'date-desc';

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private toastService: ToastService,
    private router: Router
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
    this.expenseService.getCategories().subscribe({
      next: (categories) => {
        console.log('Received categories:', categories);
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
    this.expenseService.getExpenses('All').subscribe({
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

  filterExpenses(): void {
    let filtered = [...this.originalExpenses];

    // Filter by Category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        (expense) => expense.category === this.selectedCategory
      );
    }

    // Filter by Period
    const today = new Date('2025-06-09');
    if (this.selectedPeriod !== 'All') {
      const timeRange = this.selectedPeriod === 'Weekly' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - timeRange);

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= today;
      });
    }

    // Added search functionality to filter by date, price, or description
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((expense) => {
        const formattedDate = this.formatDate(expense.date).toLowerCase();
        const amountStr = expense.amount.toString();
        const description = expense.description.toLowerCase();
        return (
          formattedDate.includes(query) ||
          amountStr.includes(query) ||
          description.includes(query)
        );
      });
    }

    // Added sorting functionality based on sortOption
    switch (this.sortOption) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
    }

    this.expenses = filtered;
  }

  addExpense(): void {
    if (
      !this.formExpense.description ||
      !this.formExpense.amount ||
      (!this.formExpense.category && this.formExpense.type === 'Expense')
    ) {
      this.error = 'Description, amount, and category are required';
      this.toastService.show(this.error, 'error');
      return;
    }

    if (this.formExpense.type === 'Income') {
      this.formExpense.category = 'Food';
    }

    this.expenseService.addExpense(this.formExpense).subscribe({
      next: (expense) => {
        this.originalExpenses.push(expense);
        this.filterExpenses();
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
    this.formExpense = { ...expense };
  }

  updateExpense(): void {
    if (!this.editingExpense || !this.editingExpense._id) return;

    if (this.formExpense.type === 'Income') {
      this.formExpense.category = 'stipend';
    }

    this.expenseService
      .updateExpense(this.editingExpense._id, this.formExpense)
      .subscribe({
        next: (updatedExpense) => {
          const index = this.originalExpenses.findIndex(
            (e) => e._id === updatedExpense._id
          );
          if (index !== -1) {
            this.originalExpenses[index] = updatedExpense;
          }
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
    this.expenseService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.originalExpenses = this.originalExpenses.filter(
          (e) => e._id !== expenseId
        );
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

  formatDate(date: string): string {
    return format(new Date(date), 'd MMMM yyyy');
  }

  downloadPDF(): void {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
      body: this.expenses.map((e) => [
        this.formatDate(e.date),
        e.type,
        e.category,
        e.amount,
        e.description,
      ]),
    });
    doc.save('expenses.pdf');
    this.toastService.show('PDF downloaded', 'info');
  }

  downloadExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(
      this.expenses.map((e) => ({
        Date: this.formatDate(e.date),
        Type: e.type,
        Category: e.category,
        Amount: e.amount,
        Description: e.description,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });
    saveAs(blob, 'expenses.xlsx');
    this.toastService.show('Excel downloaded', 'info');
  }

  getTotalExpenses(): number {
    return this.expenses.reduce(
      (total, expense) => total + (expense.amount || 0),
      0
    );
  }
}