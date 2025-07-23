import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import 'chart.js/auto';

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
            // Calculate total from all data points
            let total = 0;
            if (context.chart.data.datasets[0].data) {
              total = context.chart.data.datasets[0].data.reduce((sum: number, val) => {
                return sum + (typeof val === 'number' ? val : 0);
              }, 0);
            }
            // Ensure total is at least 1 to avoid division by zero
            total = total || 1;
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
    console.log('Loading expense summary...');
    
    // Get expenses directly and create summary from them
    this.expenseService.getExpenses({ page: 1, pageSize: 50 }).subscribe({
      next: (res) => {
        console.log('Spend-ratio: Fetched expenses:', res);
        
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
          this.updateChartData();
        } else {
          // No expenses found
          this.summary = {
            total: 0,
            count: 0,
            byCategory: []
          };
          console.log('No expenses found, using empty summary');
          this.updateChartData();
        }
      },
      error: (err) => {
        console.error('Error loading expenses for spend-ratio:', err);
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
        
        this.updateChartData();
      }
    });
  }
  // Updates the pie chart data based on the summary
  // Maps categories to labels and totals to data points
  updateChartData(): void {
    if (!this.summary) {
      console.log('No summary data available');
      // Create empty chart
      this.pieChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#CCCCCC']
        }]
      };
      return;
    }
    
    const categories = this.summary.byCategory || [];
    
    console.log('Summary data:', this.summary);
    console.log('Categories:', categories);

    if (categories.length === 0) {
      // Handle empty data
      this.pieChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#CCCCCC']
        }]
      };
      console.log('No categories found, using default chart data');
      return;
    }

    // Filter out any categories with null or undefined values
    const validCategories = categories.filter(c => c && c.category && c.total !== undefined);
    
    if (validCategories.length === 0) {
      this.pieChartData = {
        labels: ['No Valid Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#CCCCCC']
        }]
      };
      console.log('No valid categories found, using default chart data');
      return;
    }

    // Sort categories by total amount for better visualization
    validCategories.sort((a, b) => b.total - a.total);

    this.pieChartData = {
      labels: validCategories.map((c) => c.category || 'Unknown'),
      datasets: [
        {
          data: validCategories.map((c) => c.total || 0),
          backgroundColor: this.colorPalette.slice(0, validCategories.length),
        },
      ],
    };
    
    console.log('Pie chart data:', this.pieChartData);
    
    // Force chart update
    this.pieChartData = {...this.pieChartData};
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
