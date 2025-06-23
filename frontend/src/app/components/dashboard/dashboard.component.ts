import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Category, Expense, ExpenseService } from '../../services/expense.service';
import { ToastService } from '../../services/toast.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
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
  user: User | null = null;
  expenses: Expense[] = [];
  originalExpenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
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
  pageSizeOptions = [5, 10, 20, 50];
  currentPage: number = 1;
  pageSize: number = 5;

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
      },
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

  filterExpenses(resetPage: boolean = false): void {
    if (resetPage) this.currentPage = 1;
    let filtered = [...this.originalExpenses];

    // Filter by Category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        (expense) => expense.category === this.selectedCategory
      );
    }

    // Filter by Period
    const today = new Date();
    if (this.selectedPeriod !== 'All') {
      const timeRange = this.selectedPeriod === 'Weekly' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - timeRange);

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= today;
      });
    }

    // Search functionality
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((expense) => {
        const formattedDate = this.formatDate(expense.date).toLowerCase();
        const amountStr = expense.amount.toString();
        const description = expense.description.toLowerCase();
        const category = expense.category.toLowerCase();
        return (
          formattedDate.includes(query) ||
          amountStr.includes(query) ||
          description.includes(query) ||
          category.includes(query)
        );
      });
    }

    // Sorting
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

    this.filteredExpenses = filtered;

    // Pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.expenses = filtered.slice(startIndex, endIndex);
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

    if (!this.formExpense.date) {
      this.formExpense.date = new Date().toISOString();
    }
    this.loading = true;
    this.expenseService.addExpense(this.formExpense).subscribe({
      next: (expense) => {
        this.loadExpenses();
        this.resetForm();
        this.toastService.show('Expense added successfully', 'success');
        this.error = '';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add expense';
        this.toastService.show(this.error, 'error');
        this.loading = false;
      },
    });
  }

  editExpense(expense: Expense): void {
    this.editingExpense = expense;
    this.formExpense = {
      ...expense,
      date: new Date(expense.date).toISOString().split('T')[0],
    };
  }

  updateExpense(): void {
    if (!this.editingExpense || !this.editingExpense._id) return;

    this.loading = true;
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
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update expense';
          this.toastService.show(this.error, 'error');
          this.loading = false;
        },
      });
  }

  deleteExpense(expenseId: string): void {
    this.loading = true;
    this.expenseService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.originalExpenses = this.originalExpenses.filter(
          (e) => e._id !== expenseId
        );
        this.filterExpenses();
        this.toastService.show('Expense deleted successfully', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete expense';
        this.toastService.show(this.error, 'error');
        this.loading = false;
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
  }

  formatDate(date: string): string {
    return format(new Date(date), 'd MMMM yyyy');
  }

  getTotalExpenses(): number {
    return this.filteredExpenses.reduce(
      (total, expense) => total + (expense.amount || 0),
      0
    );
  }

  downloadPDF(): void {
    const doc = new jsPDF();
    const marginX = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setTextColor(52, 144, 220);
    doc.text('SpendWise', marginX, 25);

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('Expense Report', marginX, 35);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, marginX, 45);

    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, 50, pageWidth - marginX, 50);

    const totalAmount = this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    doc.setFillColor(248, 249, 250);
    doc.rect(marginX, 55, pageWidth - 2 * marginX, 20, 'F');

    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text('Summary:', marginX + 5, 65);
    doc.text(`Total Expenses: ${totalAmount.toLocaleString()}`, marginX + 5, 72);
    doc.text(`Number of Expenses: ${this.filteredExpenses.length}`, pageWidth - marginX - 60, 72);

    autoTable(doc, {
      head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
      body: this.filteredExpenses.map((e) => [
        this.formatDate(e.date),
        e.type,
        e.category,
        `${e.amount.toLocaleString()}`,
        e.description,
      ]),
      startY: 85,
      theme: 'grid',
      margin: { left: marginX, right: marginX },
      headStyles: {
        fillColor: [52, 144, 220],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        minCellHeight: 6,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'left', cellWidth: 'auto' },
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        overflow: 'linebreak',
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, marginX, doc.internal.pageSize.height - 10);
      doc.text('Generated by SpendWise', pageWidth - marginX - 45, doc.internal.pageSize.height - 10);
    }

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`SpendWise_Report_${dateStr}.pdf`);
    this.toastService.show('PDF downloaded successfully!', 'success');
  }

  downloadExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    const blue = '348cdc';
    const lightGray = 'f8f9fa';
    const darkText = '333333';

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'SpendWise';
    titleCell.font = { size: 20, bold: true, color: { argb: blue } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'Expense Report';
    subtitleCell.font = { size: 14, color: { argb: darkText } };
    worksheet.mergeCells('A3:E3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Generated on: ${new Date().toLocaleDateString()}`;
    dateCell.font = { size: 10, italic: true, color: { argb: '666666' } };
    dateCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const totalAmount = this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const summaryRow = worksheet.addRow([
      'Summary',
      '',
      '',
      `Total Expenses: ${totalAmount.toLocaleString()}`,
      `Number of Expenses: ${this.filteredExpenses.length}`,
    ]);
    summaryRow.font = { bold: true };
    summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightGray } };
    worksheet.addRow([]);

    const header = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    this.filteredExpenses.forEach((e) => {
      const row = worksheet.addRow([
        this.formatDate(e.date),
        e.type,
        e.category,
        e.amount,
        e.description,
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 4 ? 'right' : 'center',
        };
      });
    });

    if (worksheet.columns) {
      worksheet.columns.forEach((column) => {
        let maxLength = 12;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          maxLength = Math.max(maxLength, columnLength);
        });
        column.width = maxLength + 2;
      });
    }

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const dateStr = new Date().toISOString().split('T')[0];
      saveAs(blob, `SpendWise_Report_${dateStr}.xlsx`);
      this.toastService.show('Excel downloaded successfully!', 'info');
    });
  }

  onPageSizeChange(): void {
    this.filterExpenses(true);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredExpenses.length / this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.filterExpenses();
  }
}
