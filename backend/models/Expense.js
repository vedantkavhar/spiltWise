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
  
// const mongoose = require('mongoose');

//   const expenseSchema = new mongoose.Schema({
//     type: {
//       type: String,
//       enum: ['Income', 'Expense'],
//       required: true
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     date: {
//       type: Date,
//       default: Date.now,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     category: {
//       type: String,
//       required: true,
//       enum: ['Food', 'Travel', 'Entertainment', 'Bills', 'Shopping', 'Other'],
//       default: 'Other',
//     },
//   });

//   module.exports = mongoose.model('Expense', expenseSchema);