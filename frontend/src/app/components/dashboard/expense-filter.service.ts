import { Injectable } from '@angular/core';
import { Expense } from '../../services/expense.service';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class ExpenseFilterService {
  filterExpenses(
    originalExpenses: Expense[],
    selectedCategory: string,
    selectedPeriod: string,
    searchQuery: string,
    sortOption: string,
    currentPage: number,
    pageSize: number,
    resetPage: boolean
  ): { filteredExpenses: Expense[]; paginatedExpenses: Expense[] } {
    let filtered = [...originalExpenses];

    // Filter by Category
    // if (selectedCategory !== 'All') {
    //   filtered = filtered.filter((expense) => expense.category === selectedCategory);
    // }

    // Filter by Period
    // const today = new Date();
    // if (selectedPeriod !== 'All') {
    //   const timeRange = selectedPeriod === 'Weekly' ? 7 : 30;
    //   const startDate = new Date(today);
    //   startDate.setDate(today.getDate() - timeRange);

    //   filtered = filtered.filter((expense) => {
    //     const expenseDate = new Date(expense.date);
    //     return expenseDate >= startDate && expenseDate <= today;
    //   });
    // }

    // Search functionality
    // if (searchQuery.trim()) {
    //   const query = searchQuery.trim().toLowerCase();
    //   filtered = filtered.filter((expense) => {
    //     const formattedDate = this.formatDate(expense.date).toLowerCase();
    //     const amountStr = expense.amount.toString();
    //     const description = expense.description.toLowerCase();
    //     const category = expense.category.toLowerCase();
    //     return (
    //       formattedDate.includes(query) ||
    //       amountStr.includes(query) ||
    //       description.includes(query) ||
    //       category.includes(query)
    //     );
    //   });
    // }

    // Sorting
    // switch (sortOption) {
    //   case 'date-desc':
    //     filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    //     break;
    //   case 'date-asc':
    //     filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    //     break;
    //   case 'price-desc':
    //     filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    //     break;
    //   case 'price-asc':
    //     filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    //     break;
    // }

    // Pagination
    // const startIndex = (currentPage - 1) * pageSize;
    // const endIndex = startIndex + pageSize;
    // const paginatedExpenses = filtered.slice(startIndex, endIndex);

    return { filteredExpenses: filtered, paginatedExpenses:filtered }; // Return both filtered and paginated expenses
  }

  getTotalExpenses(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  }

  getTotalPages(filteredExpenses: Expense[], pageSize: number): number {
    return Math.ceil(filteredExpenses.length / pageSize);
  }

  formatDate(date: string): string {
    return format(new Date(date), 'd MMMM yyyy');
  }
}
