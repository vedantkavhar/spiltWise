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
    this.loadSummary();
  }
  // Added: Method to load user profile
  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.saveAuthData(this.authService.getToken()!, user);
        console.log('User profile loaded:', user); // Added for debugging
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
  // Added: Method to load expense summary
  loadSummary(): void {
    this.expenseService.getExpenseSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load expense summary';
      },
    });
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

  getCategoryProgress(categoryTotal: number): number {
    return this.summary && this.summary.total > 0 ? (categoryTotal / this.summary.total) * 100 : 0;
  }
  // Added: Method to get image URL
  getImageUrl(path: string): string {
    if (!path) return '';
    // Fixed: Normalize path and ensure correct base URL
    const normalizedPath = path.startsWith('/uploads/') ? path : `/uploads${path.startsWith('/') ? path : '/' + path}`;
    const baseUrl = environment.apiUrl.replace(/\/api$/, ''); // Remove /api
    const fullUrl = `${baseUrl}${normalizedPath}`;
    console.log('Generated image URL:', fullUrl); // Added for debugging
    return fullUrl;
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
