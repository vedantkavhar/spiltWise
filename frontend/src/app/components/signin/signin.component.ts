import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
//formsmdoule comemnted
@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ FormsModule,RouterModule, CommonModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // This method is called when the form is submitted
  // It checks if the email and password are provided, then calls the signin method from Auth
  // service to authenticate the user
  // If successful, it saves the authentication data and navigates to the dashboard
  // If there's an error, it shows a toast message with the error details
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.toastService.show('Email and password are required.', 'error');
      return;
    }

    this.isLoading = true;

    this.authService.signin(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Signin response:', response);
        this.authService.saveAuthData(response.token, response.user);
        this.toastService.show('Sign in successful! Welcome back.', 'success');
        this.isLoading = false;
        // Wait for 1 seconds (or your toast duration) before navigating
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000); // adjust to match toast display duration

        // this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Signin error:', err);
        const errorMsg = err.error?.message || err.message || 'Failed to connect to the server';
        this.toastService.show(errorMsg, 'error');
        this.isLoading = false;
      },
    });
  }
  // this is onFormChange
  onFormChange(form: any): void {
    // Optional: debug form validation
    console.log('Form state:', {
      valid: form.valid,
      email: form.controls.email?.errors,
      password: form.controls.password?.errors,
    });
  }
}
