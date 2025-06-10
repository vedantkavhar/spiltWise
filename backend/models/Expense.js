const mongoose = require('mongoose');

  const expenseSchema = new mongoose.Schema({
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
      default: 'Expense',
    },
  });

  module.exports = mongoose.model('Expense', expenseSchema);
