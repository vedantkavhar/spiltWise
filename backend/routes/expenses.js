const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');
const emailService = require('./emailService');
const User = require('../models/User');


// Get all expenses for a user (with optional category and type filter)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, type } = req.query;
    const query = { userId: req.user.userId };
    if (category && category !== 'All') {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available categories (DEPRECATED, handled by /api/categories)
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.userId }).select('name');
    res.json(['All', ...categories.map((c) => c.name)]);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense summary (total and by category)
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const total = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId), type: 'Expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      total: total[0]?.total || 0,
      count: total[0]?.count || 0,
      byCategory: byCategory.map((c) => ({
        category: c._id || 'Uncategorized',
        total: c.total,
        count: c.count,
      })),
    });
  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { description, amount, date, category } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!description || !amount || !date || !category) {
      return res.status(400).json({
        message: 'All fields (description, amount, date, category) are required'
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        message: 'Amount must be a valid positive number'
      });
    }

    // Validate category exists (optional: only if using predefined categories)
    const validCategory = await Category.findOne({ name: category });
    if (!validCategory) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Create and save expense
    const expense = new Expense({
      description: description.trim(),
      amount: parseFloat(amount),
      date: new Date(date),
      category: category.trim(),
      userId
    });

    await expense.save();

    // Fetch user details
    const user = await User.findById(userId).select('email username emailNotifications');

    // Default response if email not sent
    let emailResult = {
      success: false,
      message: 'Email notification skipped or disabled'
    };

    // Send email if enabled
    if (user?.email && user.emailNotifications !== false) {
      try {
        emailResult = await emailService.sendExpenseNotification(
          user.email,
          user.username || 'User',
          {
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            description: expense.description
          }
        );
      } catch (err) {
        console.warn('Email notification failed:', err.message);
      }
    }

    res.status(201).json({
      message: 'Expense added successfully',
      expense: {
        id: expense._id,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        createdAt: expense.createdAt
      },
      notification: {
        sent: emailResult.success,
        message: emailResult.success ? 'Email notification sent' : emailResult.message || 'Failed to send email'
      }
    });

  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      message: 'Failed to add expense',
      error: error.message
    });
  }
});

// Update an expense
// router.put('/:id', authMiddleware, async (req, res) => {
//   try {
//     const { description, amount, date, category, type } = req.body;
//     const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.userId });

//     if (!expense) {
//       return res.status(404).json({ message: 'Expense not found' });
//     }

//     if (type === 'Expense' && category) {
//       const validCategory = await Category.findOne({ name: category });

//       if (!validCategory) {
//         return res.status(400).json({ message: 'Invalid category' });
//       }
//     }

//     if (description) expense.description = description;
//     if (amount) expense.amount = amount;
//     if (date) expense.date = date;
//     expense.category = type === 'Income' ? null : category || null;
//     if (type) expense.type = type;

//     await expense.save();
//     res.json(expense);
//   } catch (error) {
//     console.error('Update expense error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Update an expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { description, amount, date, category, type } = req.body;
    const userId = req.user.userId;

    const expense = await Expense.findOne({ _id: req.params.id, userId });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (type === 'Expense' && category) {
      const validCategory = await Category.findOne({ name: category });

      if (!validCategory) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (date) expense.date = new Date(date);
    expense.category = type === 'Income' ? null : category || null;
    if (type) expense.type = type;

    await expense.save();

    // Fetch user details
    const user = await User.findById(userId).select('email username emailNotifications');

    // Default email result
    let emailResult = {
      success: false,
      message: 'Email notification skipped or disabled'
    };

    // Send email if enabled
    if (user?.email && user.emailNotifications !== false) {
      try {
        emailResult = await emailService.sendUpdatedExpenseNotification(
          user.email,
          user.username || 'User',
          {
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            type: expense.type || 'Expense',
            action: 'updated' // Pass 'updated' flag
          }
        );
      } catch (err) {
        console.warn('Email notification failed:', err.message);
      }
    }

    res.json({
      message: 'Expense updated successfully',
      expense,
      notification: {
        sent: emailResult.success,
        message: emailResult.success ? 'Email notification sent' : emailResult.message || 'Failed to send email'
      }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete an expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// New endpoint for AI-powered insights and predictions
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.userId });

    if (!expenses.length) {
      return res.status(404).json({ message: 'No expenses found' });
    }

    // Calculate average spending per category
    const categoryTotals = {};
    const categoryCounts = {};
    expenses.forEach(expense => {
      if (expense.type === 'Expense') { // Only consider expenses, not income
        const category = expense.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const categoryAverages = {};
    for (const category in categoryTotals) {
      categoryAverages[category] = categoryTotals[category] / categoryCounts[category];
    }

    // Calculate recent spending (last 30 days)
    const today = new Date(); // Hardcoded for consistency, use new Date() in production
    const recentExpenses = expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      const diffDays = (today - expenseDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 30 && exp.type === 'Expense';
    });

    const recentCategoryTotals = {};
    const recentCategoryCounts = {};
    recentExpenses.forEach(exp => {
      const category = exp.category || 'Uncategorized';
      recentCategoryTotals[category] = (recentCategoryTotals[category] || 0) + exp.amount;
      recentCategoryCounts[category] = (recentCategoryCounts[category] || 0) + 1;
    });

    const recentCategoryAverages = {};
    for (const category in recentCategoryTotals) {
      recentCategoryAverages[category] = recentCategoryTotals[category] / recentCategoryCounts[category] || 0;
    }

    // Generate insights for overspending
    const insights = [];
    for (const category in recentCategoryAverages) {
      const historicalAvg = categoryAverages[category] || 0;
      const recentAvg = recentCategoryAverages[category];
      if (recentAvg > historicalAvg * 1.3) { // 30% above historical average
        insights.push(`You've spent 30% more on '${category}' this month (₹${recentCategoryTotals[category].toFixed(2)}) compared to your historical average (₹${historicalAvg.toFixed(2)}). Consider reducing spending in this category.`);
      }
    }

    // Predict next month's spending (simple average of past months)
    const monthlyTotals = {};
    expenses.forEach(exp => {
      if (exp.type === 'Expense') {
        const date = new Date(exp.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + exp.amount;
      }
    });

    const totalMonths = Object.keys(monthlyTotals).length;
    const totalSpent = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
    const predictedSpending = totalMonths > 0 ? totalSpent / totalMonths : 0;
    insights.push(`Based on your spending, you're likely to spend around ₹${predictedSpending.toFixed(2)} next month.`);

    // Fetch user details for email notification
    const user = await User.findById(req.user.userId).select('email username emailNotifications');
    let emailResult = { success: false, message: 'Email notification skipped or disabled' };

    // Send email notification about insights if enabled
    if (user?.email && user.emailNotifications !== false && insights.length > 0) {
      try {
        emailResult = await emailService.sendInsightsNotification(
          user.email,
          user.username || 'User',
          insights
        );
      } catch (err) {
        console.warn('Insights email notification failed:', err.message);
      }
    }

    res.json({
      insights,
      notification: {
        sent: emailResult.success,
        message: emailResult.success ? 'Email notification sent' : emailResult.message || 'Failed to send email'
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
