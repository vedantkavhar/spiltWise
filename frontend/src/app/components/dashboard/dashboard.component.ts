
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Expense, ExpenseService } from '../../services/expense.service';
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
  formExpense: Partial<Expense> = {
    date: '',
    type: 'Expense',
    description: '',
    amount: 0,
    category: 'Other',
  };
  editingExpense: Expense | null = null;
  error: string = '';
  categories: string[] = [];
  selectedCategory: string = 'All';

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
        this.categories = categories;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load categories';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  loadExpenses(): void {
    this.expenseService.getExpenses(this.selectedCategory).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load expenses';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  filterExpenses(): void {
    this.loadExpenses();
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
      this.formExpense.category = "Food";
    }

    this.expenseService.addExpense(this.formExpense).subscribe({
      next: (expense) => {
        if (
          this.selectedCategory === 'All' ||
          expense.category === this.selectedCategory
        ) {
          this.expenses.push(expense);
        }
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
      this.formExpense.category = "stipend";
    }

    this.expenseService
      .updateExpense(this.editingExpense._id, this.formExpense)
      .subscribe({
        next: (updatedExpense) => {
          const index = this.expenses.findIndex(
            (e) => e._id === updatedExpense._id
          );
          if (index !== -1) {
            this.expenses[index] = updatedExpense;
          }
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
        this.expenses = this.expenses.filter((e) => e._id !== expenseId);
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
        // e.date,
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
        // Date: e.date,
         Date: this.formatDate(e.date),  // Format the date here
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
    return this.expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  }
}
