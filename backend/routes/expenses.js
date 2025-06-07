const express = require('express');
  const router = express.Router();
  const Expense = require('../models/Expense');
  const Category = require('../models/Category');
  const authMiddleware = require('../middleware/auth');
  const mongoose = require('mongoose');

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
      const { description, amount, date, category, type } = req.body;
      if (!description || !amount || !date || !type) {
        return res.status(400).json({ message: 'Description, amount, date, and type are required' });
      }

      if (type === 'Expense' && category) {
        const validCategory = await Category.findOne({ name: category, userId: req.user.userId });
        if (!validCategory) {
          return res.status(400).json({ message: 'Invalid category' });
        }
      }

      const expense = new Expense({
        description,
        amount,
        date,
        category: type === 'Income' ? null : category || null,
        type,
        userId: req.user.userId,
      });

      await expense.save();
      res.status(201).json(expense);
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update an expense
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { description, amount, date, category, type } = req.body;
      const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.userId });

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      if (type === 'Expense' && category) {
        const validCategory = await Category.findOne({ name: category, userId: req.user.userId });
        if (!validCategory) {
          return res.status(400).json({ message: 'Invalid category' });
        }
      }

      if (description) expense.description = description;
      if (amount) expense.amount = amount;
      if (date) expense.date = date;
      expense.category = type === 'Income' ? null : category || null;
      if (type) expense.type = type;

      await expense.save();
      res.json(expense);
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
// const express = require('express');
//   const router = express.Router();
//   const Expense = require('../models/Expense');
//   const authMiddleware = require('../middleware/auth');
//   const mongoose = require('mongoose'); // Added import

//   // Get all expenses for a user (with optional category filter)
//   router.get('/', authMiddleware, async (req, res) => {
//     try {
//       const { category } = req.query;
//       const query = { userId: req.user.userId };
//       if (category && category !== 'All') {
//         query.category = category;
//       }
//       const expenses = await Expense.find(query).sort({ date: -1 });
//       res.json(expenses);
//     } catch (error) {
//       console.error('Get expenses error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // Get available categories
//   router.get('/categories', authMiddleware, async (req, res) => {
//     try {
//       const categories = ['All', 'Food', 'Travel', 'Entertainment', 'Bills', 'Shopping', 'Other'];
//       res.json(categories);
//     } catch (error) {
//       console.error('Get categories error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // Get expense summary (total and by category)
//   router.get('/summary', authMiddleware, async (req, res) => {
//     try {
//       const total = await Expense.aggregate([
//         { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
//       ]);

//       const byCategory = await Expense.aggregate([
//         { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
//         { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//         { $sort: { _id: 1 } },
//       ]);

//       res.json({
//         total: total[0]?.total || 0,
//         count: total[0]?.count || 0,
//         byCategory: byCategory.map((c) => ({
//           category: c._id,
//           total: c.total,
//           count: c.count,
//         })),
//       });
//     } catch (error) {
//       console.error('Get expense summary error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // Add a new expense
//   router.post('/', authMiddleware, async (req, res) => {
//     try {
//       const { type, category, amount, date, description } = req.body;
//       if (!description || !amount || !category) {
//         return res.status(400).json({ message: 'Description, amount, and category are required' });
//       }

//       const expense = new Expense({
//         type,
//         category,
//         amount,
//         date: date || Date.now(),
//         description,
//         userId: req.user.userId,
//       });

//       await expense.save();
//       res.status(201).json(expense);
//     } catch (error) {
//       console.error('Add expense error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // Update an expense
//   router.put('/:id', authMiddleware, async (req, res) => {
//     try {
//       const { type, category, amount, date, description } = req.body;
//       const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.userId });

//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }
//       if (type) expense.type = type;
//       if (category) expense.category = category;
//       if (amount) expense.amount = amount;
//       if (date) expense.date = date;
//       if (description) expense.description = description;
      
      
      

//       await expense.save();
//       res.json(expense);
//     } catch (error) {
//       console.error('Update expense error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // Delete an expense
//   router.delete('/:id', authMiddleware, async (req, res) => {
//     try {
//       const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
//       if (!expense) {
//         return res.status(404).json({ message: 'Expense not found' });
//       }
//       res.json({ message: 'Expense deleted' });
//     } catch (error) {
//       console.error('Delete expense error:', error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   module.exports = router;