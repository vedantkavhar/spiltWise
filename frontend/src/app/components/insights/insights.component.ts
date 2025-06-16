import { Component, OnInit } from '@angular/core';
import { ExpenseService, InsightsResponse } from '../../services/expense.service'; // Adjust the import path as necessary
import { ToastService } from '../../services/toast.service'; // Assuming you have this for notifications
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink,RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-insights',
  imports: [CommonModule,RouterLink, RouterLinkActive],
  standalone: true,
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.css'],
})
export class InsightsComponent implements OnInit {
  insights: string[] = [];
  notificationMessage: string = '';
  error: string = '';

  constructor(
    private expenseService: ExpenseService,
    private toastService: ToastService,
    private authService:AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  loadInsights(): void {
    this.expenseService.getInsights().subscribe({
      next: (response: InsightsResponse) => {
        this.insights = response.insights;
        this.notificationMessage = response.notification.message;
        if (response.notification.sent) {
          this.toastService.show('Insights email sent successfully', 'success');
        } else if (response.notification.message) {
          this.toastService.show(response.notification.message, 'info');
        }
        if (!this.insights.length) {
          this.error = 'No insights available. Add more expenses to get personalized insights!';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load insights';
        this.toastService.show(this.error, 'error');
      },
    });
  }

  
  logout(): void {
    this.authService.logout();
    this.toastService.show('Logged out successfully', 'success');
    this.router.navigate(['/signin']);
  }

}