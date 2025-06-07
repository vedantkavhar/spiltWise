import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { AuthService } from '../../services/auth.service';
import { ExpenseService, ExpenseSummary } from '../../services/expense.service';

@Component({
  selector: 'app-spend-ratio',
  standalone: true,
  imports: [CommonModule, RouterModule, NgChartsModule],
  templateUrl: './spend-ratio.component.html',
  styleUrls: ['./spend-ratio.component.css']
})
export class SpendRatioComponent implements OnInit {
  summary: ExpenseSummary | null = null;
  error = '';

  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }],
  };

  pieChartType: ChartType = 'pie';

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const raw = context.raw as number;
            const total = this.summary?.total || 1;
            const percentage = ((raw / total) * 100).toFixed(2);
            return `${label}: ₹${raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
    } else {
      this.loadSummary();
    }
  }

  loadSummary(): void {
    this.expenseService.getExpenseSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.updateChartData();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load expense summary';
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/signin']);
        }
      },
    });
  }

  updateChartData(): void {
    if (!this.summary) return;
    const categories = this.summary.byCategory;

    this.pieChartData = {
      labels: categories.map((c) => c.category),
      datasets: [
        {
          data: categories.map((c) => c.total),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
