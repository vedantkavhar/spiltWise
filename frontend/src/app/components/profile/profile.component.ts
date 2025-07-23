import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { ExpenseService, ExpenseSummary } from '../../services/expense.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment'; // Adjust the path as necessary
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  user: User | null = null;
  summary: ExpenseSummary | null = null;
  error: string = '';
  isUploading: boolean = false;
  imageLoadError: boolean = false;

  // Added: ViewChild to access the file input element
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private router: Router
  ) {
    this.loadProfile();
    // Load summary after profile is loaded to ensure token is set
  }
  // Method to load user profile
  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.saveAuthData(this.authService.getToken()!, user);
        console.log('User profile loaded:', user); // Added for debugging
        
        // Load summary after profile is loaded
        this.loadSummary();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/signin']);
        }
      },
    });
  }
  // Method to load expense summary
  loadSummary(): void {
    console.log('Loading expense summary for profile...');
    // Make sure we have a valid token before making the request
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      this.error = 'Authentication error. Please log in again.';
      this.summary = { total: 0, count: 0, byCategory: [] };
      return;
    }
    
    // Add a delay to ensure the token is properly set
    setTimeout(() => {
      // Get expenses directly and create summary from them
      this.expenseService.getExpenses({ page: 1, pageSize: 20 }).subscribe({
        next: (res) => {
          console.log('Profile: Fetched expenses:', res);
          
          // Create summary directly from expenses
          const expenses = res.expenses || [];
          if (expenses.length > 0) {
            // Group expenses by category
            const categoryMap = new Map();
            expenses.forEach(expense => {
              if (expense.category) {
                if (!categoryMap.has(expense.category)) {
                  categoryMap.set(expense.category, { total: 0, count: 0 });
                }
                categoryMap.get(expense.category).total += expense.amount;
                categoryMap.get(expense.category).count += 1;
              }
            });
            
            // Create summary object
            this.summary = {
              total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
              count: expenses.length,
              byCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
                category,
                total: data.total,
                count: data.count,
                type: 'Expense'
              }))
            };
            
            console.log('Created summary from expenses:', this.summary);
          } else {
            // No expenses found
            this.summary = {
              total: 0,
              count: 0,
              byCategory: []
            };
            console.log('No expenses found, using empty summary');
          }
        },
        error: (err) => {
          console.error('Error loading expenses for profile:', err);
          this.error = err.error?.message || 'Failed to load expenses';
          
          // Set default values on error
          this.summary = {
            total: 0,
            count: 0,
            byCategory: []
          };
          
          // If unauthorized, redirect to login
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/signin']);
          }
        }
      });
    }, 500); // Small delay to ensure token is set
  }
  // Added: Method to trigger file input click
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  // Added: Method to handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isUploading = true;
      this.error = '';
      this.imageLoadError = false;
      this.authService.uploadProfilePicture(file).subscribe({
        next: (response) => {
          this.user = response.user;
          this.authService.saveAuthData(this.authService.getToken()!, response.user);
          this.isUploading = false;
          this.error = 'Profile picture updated successfully!';
          // Added: Auto-dismiss success message after 5 seconds
          setTimeout(() => {
            if (this.error === 'Profile picture updated successfully!') {
              this.error = '';
            }
          }, 2000);
          console.log('Upload response:', response); // Added for debugging
        },
        error: (err) => {
          this.error = err.message || 'Failed to upload profile picture';
          this.isUploading = false;
          console.error('Upload error:', err); // Added for debugging
        },
      });
    }
  }

  getTotalAmount(): number {
    if (this.summary && this.summary.byCategory) {
      return this.summary.byCategory.reduce((sum, cat) => sum + cat.total, 0);
    }
    return 0;
  }

  getTotalCount(): number {
    if (this.summary && this.summary.byCategory) {
      return this.summary.byCategory.reduce((sum, cat) => sum + cat.count, 0);
    }
    return 0;
  }

  getCategoryProgress(categoryTotal: number): number {
    // Force recalculation of total from byCategory to ensure it's accurate
    const calculatedTotal = this.getTotalAmount();
    return calculatedTotal > 0 ? (categoryTotal / calculatedTotal) * 100 : 0;
  }
  // Method to get image URL
  getImageUrl(path: string): string {
    if (!path) return '';
    // Normalize path and ensure correct base URL
    const normalizedPath = path.startsWith('/uploads/') ? path : `/uploads${path.startsWith('/') ? path : '/' + path}`;
    const baseUrl = 'http://localhost:5000'; // Use the direct base URL
    return `${baseUrl}${normalizedPath}`;
  }

  onImageError(event: Event): void {
    this.imageLoadError = true;
    this.error = 'Failed to load profile picture. Please try uploading again.';
    console.error('Image load error for URL:', (event.target as HTMLImageElement).src); // Added for debugging
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
