import { Component, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnDestroy {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  private successTimeout: any;
  private errorTimeout: any;

  // 🔧 Added: to access the form reference and reset it
  @ViewChild('signupForm') signupForm!: NgForm;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Check if passwords match
  get passwordMismatch(): boolean {
    return this.password !== this.confirmPassword && this.confirmPassword.length > 0;
  }

  onSubmit(): void {
    // Clear previous messages and timeouts
    this.error = '';
    this.successMessage = '';
    this.showSuccessModal = false;
    this.showErrorModal = false;
    this.clearTimeouts();

    if (this.passwordMismatch) {
      this.error = 'Passwords do not match';
      this.showErrorModal = true;
      this.errorTimeout = setTimeout(() => {
        this.closeErrorModal();
      }, 1000);
      return;
    }

    this.isLoading = true;

    // Call the signup method from AuthService
    this.authService.signup(this.username, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Signup response:', response);

        this.successMessage = 'Sign up successful! Welcome to our platform.';
        this.showSuccessModal = true;
        this.isLoading = false;

        this.authService.saveAuthData(response.token, response.user);

        // 🔧 Updated: reset the full form including validation states
        this.clearForm();

        this.successTimeout = setTimeout(() => {
          this.closeSuccessModal();
        }, 1000);
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.error = err.error?.message || err.message || 'Failed to connect to the server';
        this.showErrorModal = true;
        this.isLoading = false;
        console.log('Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
        });

        this.errorTimeout = setTimeout(() => {
          this.closeErrorModal();
        }, 1000);
      },
    });
  }

  closeSuccessModal(): void {
    this.clearTimeouts();
    this.showSuccessModal = false;
    this.successMessage = '';
    setTimeout(() => {
      this.router.navigate(['/signin']);
    }, 200);
  }

  closeErrorModal(): void {
    this.clearTimeouts();
    this.showErrorModal = false;
    this.error = '';
  }

  private clearTimeouts(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = null;
    }
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
  }

  // 🔧 Updated: properly reset form state (not just field values)
  private clearForm(): void {
    if (this.signupForm) {
      this.signupForm.resetForm();
    }
  }
}
