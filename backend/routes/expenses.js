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
    console.error('user', user.username);
    // Default response if email not sent
    let emailResult = {
      success: false,
      message: 'Email notification skipped or disabled'
    };

    // Send email if enabled
    if (user?.email && user.emailNotifications !== false) {
      try {
         console.error('userName', user.username);
        emailResult = await emailService.sendExpenseNotification(
          user.email,
          user.username || 'User',
          {
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
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

module.exports = router;
