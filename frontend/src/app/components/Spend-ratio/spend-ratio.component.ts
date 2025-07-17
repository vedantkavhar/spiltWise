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
  styleUrls: ['./spend-ratio.component.css'],
})
export class SpendRatioComponent implements OnInit {
  summary: ExpenseSummary | null = null;
  error = '';

  colorPalette = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#C9CBCF',
    '#8BC34A',
    '#E91E63',
    '#00BCD4',
    '#CDDC39',
    '#9C27B0',
    '#FFC107',
    '#795548',
    '#607D8B',
  ];

  // Data structure for the pie chart

  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };

  pieChartType: ChartType = 'pie';
  // Chart options for appearance and tooltips

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff', // makes the legend text white
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          // Customizes tooltip to show value and percentage

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

  // Redirect to signin if not authenticated

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
    } else {
      this.loadSummary();
    }
  }

  // Loads the expense summary from the backend
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
  // Updates the pie chart data based on the summary
  // Maps categories to labels and totals to data points
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
            '#C9CBCF',
            '#8BC34A',
            '#E91E63',
            '#00BCD4',
            '#CDDC39',
            '#9C27B0',
            '#FFC107',
            '#795548',
            '#607D8B',
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
