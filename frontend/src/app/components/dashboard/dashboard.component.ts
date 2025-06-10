// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { AuthService,User } from '../../services/auth.service';
// import { Category, Expense, ExpenseService } from '../../services/expense.service';
// import { ToastService } from '../../services/toast.service';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import { format } from 'date-fns';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.css'],
// })
// export class DashboardComponent {
//   // user: { id: string; username: string; email: string; phone?: string } | null = null;
//   user: User | null = null; // Use the User interface
//   expenses: Expense[] = [];
//   originalExpenses: Expense[] = [];
//   formExpense: Partial<Expense> = {
//     date: '',
//     type: 'Expense',
//     description: '',
//     amount: 0,
//     category: 'Other',
//   };
//   editingExpense: Expense | null = null;
//   error: string = '';
//   categories: Category[] = [];
//   selectedCategory: string = 'All';
//   selectedPeriod: string = 'All';
//   searchQuery: string = '';
//   sortOption: string = 'date-desc';
//   userPhone: string = '';
//   whatsappLink: string | null = null; // Add property to store the WhatsApp link

//   constructor(
//     private authService: AuthService,
//     private expenseService: ExpenseService,
//     private toastService: ToastService,
//     private router: Router
//   ) {
//     this.user = this.authService.getUser();
//     if (!this.user) {
//       this.router.navigate(['/signin']);
//     } else {
//       // this.userPhone = this.user.phone || '';
//       this.userPhone = this.user.phone || ''; // phone is now guaranteed in the User interface

//       if (!this.userPhone) {

//         console.warn('User phone number not found in profile');

//       }
//       console.log('User phone from AuthService:', this.userPhone);
//       this.loadCategories();
//       this.loadExpenses();
//     }
//   }

//   loadCategories(): void {
//     this.expenseService.getCategories().subscribe({
//       next: (categories) => {
//         console.log('Received categories:', categories);
//         this.categories = categories;
//       },
//       error: (err) => {
//         const errorMessage = err?.error?.message || 'Failed to load categories';
//         this.toastService.show(errorMessage, 'error');
//         console.error('Error loading categories:', err);
//       }
//     });
//   }

//   loadExpenses(): void {
//     this.expenseService.getExpenses('All').subscribe({
//       next: (expenses) => {
//         this.originalExpenses = expenses;
//         this.filterExpenses();
//       },
//       error: (err) => {
//         this.error = err.error?.message || 'Failed to load expenses';
//         this.toastService.show(this.error, 'error');
//       },
//     });
//   }

//   filterExpenses(): void {
//     let filtered = [...this.originalExpenses];

//     if (this.selectedCategory !== 'All') {
//       filtered = filtered.filter(
//         (expense) => expense.category === this.selectedCategory
//       );
//     }

//     const today = new Date('2025-06-09');
//     if (this.selectedPeriod !== 'All') {
//       const timeRange = this.selectedPeriod === 'Weekly' ? 7 : 30;
//       const startDate = new Date(today);
//       startDate.setDate(today.getDate() - timeRange);

//       filtered = filtered.filter((expense) => {
//         const expenseDate = new Date(expense.date);
//         return expenseDate >= startDate && expenseDate <= today;
//       });
//     }

//     if (this.searchQuery.trim()) {
//       const query = this.searchQuery.trim().toLowerCase();
//       filtered = filtered.filter((expense) => {
//         const formattedDate = this.formatDate(expense.date).toLowerCase();
//         const amountStr = expense.amount.toString();
//         const description = expense.description.toLowerCase();
//         const category = expense.category.toLowerCase();
//         return (
//           formattedDate.includes(query) ||
//           amountStr.includes(query) ||
//           description.includes(query) ||
//           category.includes(query)
//         );
//       });
//     }

//     switch (this.sortOption) {
//       case 'date-desc':
//         filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
//         break;
//       case 'date-asc':
//         filtered.sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());
//         break;
//       case 'price-desc':
//         filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
//         break;
//       case 'price-asc':
//         filtered.sort((a, b) => (a.amount || 0) - (a.amount || 0));
//         break;
//     }

//     this.expenses = filtered;
//   }

//   addExpense(): void {
//     if (
//       !this.formExpense.description ||
//       !this.formExpense.amount ||
//       (!this.formExpense.category && this.formExpense.type === 'Expense')
//     ) {
//       this.error = 'Description, amount, and category are required';
//       this.toastService.show(this.error, 'error');
//       return;
//     }

//     if (!this.formExpense.date) {
//       this.formExpense.date = new Date().toISOString();
//     }

//     if (this.formExpense.type === 'Income') {
//       this.formExpense.category = 'Food';
//     }

//     this.expenseService.addExpense(this.formExpense).subscribe({
//       next: (expense) => {
//         console.log('Expense added successfully:', expense);
//         this.originalExpenses.push(expense);
//         this.filterExpenses();
//         this.generateWhatsAppLink(expense);
//         this.resetForm();
//         this.toastService.show('Expense added successfully', 'success');
//         this.error = '';
//       },
//       error: (err) => {
//         this.error = err.error?.message || 'Failed to add expense';
//         this.toastService.show(this.error, 'error');
//         console.error('Error adding expense:', err);
//       },
//     });
//   }

//   generateWhatsAppLink(expense: Expense): void {
//     console.log('Starting WhatsApp link generation for expense:', expense);

//     // Prompt user for phone number
//     const phoneNumberInput = prompt(
//       'Please enter the phone number to receive the WhatsApp notification (e.g., +919876543210):',
//       this.userPhone || ''
//     );
//     console.log('Phone number input from prompt:', phoneNumberInput);

//     // Handle cancel or empty input
//     if (!phoneNumberInput || phoneNumberInput.trim() === '') {
//       console.log('No phone number provided, generating link without a specific number');
//       this.toastService.show('No phone number provided. WhatsApp link generated without a specific number.', 'info');
//       this.createWhatsAppLink(expense, '');
//       return;
//     }

//     // Validate phone number format (basic validation for international format)
//     const cleanedPhoneNumber = phoneNumberInput.replace(/\D/g, ''); // Remove non-digits
//     console.log('Cleaned phone number:', cleanedPhoneNumber);
//     const phoneNumberRegex = /^\+?\d{10,15}$/; // Basic regex for international phone number
//     let formattedPhoneNumber = cleanedPhoneNumber;

//     if (!phoneNumberRegex.test(phoneNumberInput)) {
//       // If the input doesn't start with "+", try adding it
//       if (!phoneNumberInput.startsWith('+')) {
//         formattedPhoneNumber = `+${cleanedPhoneNumber}`;
//         console.log('Added "+" to phone number:', formattedPhoneNumber);
//         if (!phoneNumberRegex.test(formattedPhoneNumber)) {
//           console.log('Phone number still invalid after adding "+":', formattedPhoneNumber);
//           this.toastService.show('Invalid phone number format. WhatsApp link generated without a specific number.', 'error');
//           this.createWhatsAppLink(expense, '');
//           return;
//         }
//       } else {
//         console.log('Phone number invalid:', phoneNumberInput);
//         this.toastService.show('Invalid phone number format. WhatsApp link generated without a specific number.', 'error');
//         this.createWhatsAppLink(expense, '');
//         return;
//       }
//     }

//     // If the phone number is valid, generate the link with the number
//     console.log('Phone number validated successfully:', formattedPhoneNumber);
//     this.createWhatsAppLink(expense, formattedPhoneNumber);
//   }

//   createWhatsAppLink(expense: Expense, phoneNumber: string): void {
//     console.log('Creating WhatsApp link with phone number:', phoneNumber);
//     const date = format(new Date(expense.date), 'MM/dd');
//     const message = `New expense added: ${expense.amount} INR in ${expense.category} on ${date}. Description: ${expense.description}`;
//     console.log('Message to encode:', message);
//     const encodedMessage = encodeURIComponent(message);
//     console.log('Encoded message:', encodedMessage);

//     // Generate WhatsApp link
//     const whatsappLink = phoneNumber
//       ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
//       : `https://wa.me/?text=${encodedMessage}`;
//     console.log('Generated WhatsApp link:', whatsappLink);

//     // Store the link for display in the UI
//     this.whatsappLink = whatsappLink;

//     // Attempt to open the WhatsApp link in a new tab/window
//     try {
//       const newWindow = window.open(whatsappLink, '_blank');
//       if (newWindow) {
//         console.log('New tab opened successfully');
//         this.toastService.show('WhatsApp link generated and opened', 'success');
//       } else {
//         console.error('Failed to open new tab - newWindow is null');
//         this.toastService.show('WhatsApp link generated but failed to open. Click the link below to open WhatsApp.', 'info');
//       }
//     } catch (error) {
//       console.error('Error opening WhatsApp link:', error);
//       this.toastService.show('WhatsApp link generated but failed to open. Click the link below to open WhatsApp.', 'info');
//     }
//   }

//   editExpense(expense: Expense): void {
//     this.editingExpense = expense;
//     this.formExpense = { ...expense };
//   }

//   updateExpense(): void {
//     if (!this.editingExpense || !this.editingExpense._id) return;

//     if (this.formExpense.type === 'Income') {
//       this.formExpense.category = 'stipend';
//     }

//     this.expenseService
//       .updateExpense(this.editingExpense._id, this.formExpense)
//       .subscribe({
//         next: (updatedExpense) => {
//           const index = this.originalExpenses.findIndex(
//             (e) => e._id === updatedExpense._id
//           );
//           if (index !== -1) {
//             this.originalExpenses[index] = updatedExpense;
//           }
//           this.filterExpenses();
//           this.resetForm();
//           this.editingExpense = null;
//           this.toastService.show('Expense updated successfully', 'success');
//           this.error = '';
//         },
//         error: (err) => {
//           this.error = err.error?.message || 'Failed to update expense';
//           this.toastService.show(this.error, 'error');
//         },
//       });
//   }

//   deleteExpense(expenseId: string): void {
//     this.expenseService.deleteExpense(expenseId).subscribe({
//       next: () => {
//         this.originalExpenses = this.originalExpenses.filter(
//           (e) => e._id !== expenseId
//         );
//         this.filterExpenses();
//         this.toastService.show('Expense deleted successfully', 'success');
//       },
//       error: (err) => {
//         this.error = err.error?.message || 'Failed to delete expense';
//         this.toastService.show(this.error, 'error');
//       },
//     });
//   }

//   resetForm(): void {
//     this.formExpense = {
//       date: '',
//       type: 'Expense',
//       description: '',
//       amount: 0,
//       category: 'Other',
//     };
//     this.editingExpense = null;
//   }

//   cancelEdit(): void {
//     this.resetForm();
//   }

//   logout(): void {
//     this.authService.logout();
//     this.toastService.show('Logged out successfully', 'success');
//     setTimeout(() => {
//       this.router.navigate(['/signin']);
//     }, 2000);
//   }

//   formatDate(date: string): string {
//     return format(new Date(date), 'd MMMM yyyy');
//   }

//   downloadPDF(): void {
//     const doc = new jsPDF();
//     autoTable(doc, {
//       head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
//       body: this.expenses.map((e) => [
//         this.formatDate(e.date),
//         e.type,
//         e.category,
//         e.amount,
//         e.description,
//       ]),
//     });
//     doc.save('expenses.pdf');
//     this.toastService.show('PDF downloaded', 'info');
//   }

//   downloadExcel(): void {
//     const worksheet = XLSX.utils.json_to_sheet(
//       this.expenses.map((e) => ({
//         Date: this.formatDate(e.date),
//         Type: e.type,
//         Category: e.category,
//         Amount: e.amount,
//         Description: e.description,
//       }))
//     );
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
//     const excelBuffer: any = XLSX.write(workbook, {
//       bookType: 'xlsx',
//       type: 'array',
//     });
//     const blob = new Blob([excelBuffer], {
//       type: 'application/octet-stream',
//     });
//     saveAs(blob, 'expenses.xlsx');
//     this.toastService.show('Excel downloaded', 'info');
//   }

//   getTotalExpenses(): number {
//     return this.expenses.reduce(
//       (total, expense) => total + (expense.amount || 0),
//       0
//     );
//   }
// }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
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
  selectedCategory: string = 'All';
  selectedPeriod: string = 'All';
  searchQuery: string = '';
  sortOption: string = 'date-desc';
  userPhone: string = '';
  whatsappLink: string | null = null;

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
      this.userPhone = this.user.phone || '';
      console.log('User phone from AuthService:', this.userPhone);
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

    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(
        (expense) => expense.category === this.selectedCategory
      );
    }

    const today = new Date('2025-06-10');
    if (this.selectedPeriod !== 'All') {
      const timeRange = this.selectedPeriod === 'Weekly' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - timeRange);

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= today;
      });
    }

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
        filtered.sort((a, b) => (a.amount || 0) - (a.amount || 0));
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

    if (!this.formExpense.date) {
      this.formExpense.date = new Date().toISOString();
    }

    if (this.formExpense.type === 'Income') {
      this.formExpense.category = 'Food';
    }

    this.expenseService.addExpense(this.formExpense).subscribe({
      next: (expense) => {
        console.log('Expense added successfully:', expense);
        this.originalExpenses.push(expense);
        this.filterExpenses();
        this.generateWhatsAppLink(expense);
        this.resetForm();
        this.toastService.show('Expense added successfully', 'success');
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to add expense';
        this.toastService.show(this.error, 'error');
        console.error('Error adding expense:', err);
      },
    });
  }

  generateWhatsAppLink(expense: Expense): void {
    console.log('Starting WhatsApp link generation for expense:', expense);

    let phoneNumber = this.userPhone || '';
    if (phoneNumber && !phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
    }
    console.log('Using phone number:', phoneNumber);

    this.createWhatsAppLink(expense, phoneNumber);
  }

  createWhatsAppLink(expense: Expense, phoneNumber: string): void {
    console.log('Creating WhatsApp link with phone number:', phoneNumber);
    const date = format(new Date(expense.date), 'MM/dd');
    const message = `New expense added: ${expense.amount} INR in ${expense.category} on ${date}. Description: ${expense.description}`;
    console.log('Message to encode:', message);
    const encodedMessage = encodeURIComponent(message);
    console.log('Encoded message:', encodedMessage);

    const whatsappLink = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    console.log('Generated WhatsApp link:', whatsappLink);

    this.whatsappLink = whatsappLink;
    this.toastService.show('WhatsApp link generated. Click the link below to share on WhatsApp.', 'info');
  }

  editExpense(expense: Expense): void {
    this.whatsappLink = null; // Clear WhatsApp link when editing
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
    // Do not reset whatsappLink here to keep it visible
  }

  cancelEdit(): void {
    this.whatsappLink = null; // Clear WhatsApp link when cancelling edit
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