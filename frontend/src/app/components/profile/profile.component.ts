import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { ExpenseService, ExpenseSummary } from '../../services/expense.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loadProfile();
    this.loadSummary();
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.saveAuthData(this.authService.getToken()!, user);
        console.log('User profile loaded:', user);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
        this.toastService.show(this.error, 'error');
        console.error('Profile load error:', err);
      },
    });
  }

  loadSummary(): void {
    this.expenseService.getExpenseSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load expense summary';
        this.toastService.show(this.error, 'error');
        console.error('Summary load error:', err);
      },
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

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
          this.toastService.show(this.error, 'success');
          setTimeout(() => {
            if (this.error === 'Profile picture updated successfully!') {
              this.error = '';
            }
          }, 2000);
          console.log('Upload response:', response);
        },
        error: (err) => {
          this.error = err.message || 'Failed to upload profile picture';
          this.toastService.show(this.error, 'error');
          this.isUploading = false;
          console.error('Upload error:', err);
        },
      });
    }
  }

  getCategoryProgress(categoryTotal: number): number {
    return this.summary && this.summary.total > 0 ? (categoryTotal / this.summary.total) * 100 : 0;
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    const normalizedPath = path.startsWith('/uploads/') ? path : `/uploads${path.startsWith('/') ? path : '/' + path}`;
    const baseUrl = environment.apiUrl.replace(/\/api$/, '');
    const fullUrl = `${baseUrl}${normalizedPath}`;
    console.log('Generated image URL:', fullUrl);
    return fullUrl;
  }

  onImageError(event: Event): void {
    this.imageLoadError = true;
    this.error = 'Failed to load profile picture. Please try uploading again.';
    this.toastService.show(this.error, 'error');
    console.error('Image load error for URL:', (event.target as HTMLImageElement).src);
  }

  logout(): void {
    this.authService.logout();
  }
}
