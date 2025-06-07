// import { Component } from '@angular/core';
//   import { AuthService } from '../../services/auth.service';
//   import { Router } from '@angular/router';
//   import { FormsModule } from '@angular/forms';
//   import { RouterModule } from '@angular/router';
//   import { CommonModule } from '@angular/common';

//   @Component({
//     selector: 'app-signup',
//     standalone: true,
//     imports: [FormsModule, RouterModule, CommonModule],
//     templateUrl: './signup.component.html',
//     styleUrls: ['./signup.component.css'],
//   })
//   export class SignupComponent {
//     username: string = '';
//     email: string = '';
//     password: string = '';
//     error: string = '';
//     confirmPassword: string = '';
//     isLoading: boolean = false;
//     successMessage: string = '';

//    constructor(private authService: AuthService, private router: Router) {}

//     // Check if passwords match
//   get passwordMismatch(): boolean {
//     return this.password !== this.confirmPassword && this.confirmPassword.length > 0;
//   }

//     onSubmit(): void {
//       this.error = ''; // Clear previous errors
//       this.successMessage = '';
//       this.authService.signup(this.username, this.email, this.password).subscribe({
//         next: (response) => {
//           console.log('Signup response:', response);
//           this.authService.saveAuthData(response.token, response.user);
//           this.router.navigate(['/dashboard']); // Navigate to the dashboard after successful signup
//         },
//         error: (err) => {
//           console.error('Signup error:', err);
//           this.error = err.error?.message || err.message || 'Failed to connect to the server';
//           console.log('Error details:', { status: err.status, statusText: err.statusText, error: err.error });
//         },
//       });
//     }

//     private clearForm() {
//     this.username = '';
//     this.email = '';
//     this.password = '';
//     this.confirmPassword = '';
//   }
//   }

import { Component, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  error: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  private successTimeout: any;
  private errorTimeout: any;

  constructor(private authService: AuthService, private router: Router) {}

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
    
    // Additional validation
    if (this.passwordMismatch) {
      this.error = 'Passwords do not match';
      this.showErrorModal = true;
      // Auto close error modal after 3 seconds
      this.errorTimeout = setTimeout(() => {
        this.closeErrorModal();
      }, 3000);
      return;
    }

    // Set loading state
    this.isLoading = true;

    this.authService.signup(this.username, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Signup response:', response);
        
        // Show success message in popup
        this.successMessage = 'Sign up successful! Welcome to our platform.';
        this.showSuccessModal = true;
        this.isLoading = false;
        
        // Save auth data
        this.authService.saveAuthData(response.token, response.user);
        
        // Clear form
        this.clearForm();
        
        // Auto close success modal after 3 seconds
        this.successTimeout = setTimeout(() => {
          this.closeSuccessModal();
        }, 2000);
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.error = err.error?.message || err.message || 'Failed to connect to the server';
        this.showErrorModal = true;
        this.isLoading = false;
        console.log('Error details:', { 
          status: err.status, 
          statusText: err.statusText, 
          error: err.error 
        });
        
        // Auto close error modal after 4 seconds (longer for error messages)
        this.errorTimeout = setTimeout(() => {
          this.closeErrorModal();
        }, 2000);
      },
    });
  }

  closeSuccessModal(): void {
    this.clearTimeouts();
    this.showSuccessModal = false;
    this.successMessage = '';
    // Navigate to dashboard after closing success modal
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
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
    // Clean up timeouts when component is destroyed
    this.clearTimeouts();
  }

  private clearForm() {
    this.username = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }
}