const express = require('express');
  const router = express.Router();
  const Category = require('../models/category');
  const authMiddleware = require('../middleware/auth');

  // Get all categories for a user
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const categories = await Category.find({ userId: req.user.userId }).select('name');
      res.json(categories.map((c) => c.name));
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add a new category
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const existingCategory = await Category.findOne({ name, userId: req.user.userId });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      const category = new Category({
        name,
        userId: req.user.userId,
      });

      await category.save();
      res.status(201).json(category.name);
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update a category
  router.put('/:name', authMiddleware, async (req, res) => {
    try {
      const { newName } = req.body;
      if (!newName) {
        return res.status(400).json({ message: 'New category name is required' });
      }

      const category = await Category.findOne({ name: req.params.name, userId: req.user.userId });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const existingCategory = await Category.findOne({ name: newName, userId: req.user.userId });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }

      category.name = newName;
      await category.save();

      // Update expenses with old category name
      await Expense.updateMany(
        { userId: req.user.userId, category: req.params.name },
        { $set: { category: newName } }
      );

      res.json(category.name);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete a category
  router.delete('/:name', authMiddleware, async (req, res) => {
    try {
      const category = await Category.findOneAndDelete({ name: req.params.name, userId: req.user.userId });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Set category to null for expenses using this category
      await Expense.updateMany(
        { userId: req.user.userId, category: req.params.name },
        { $set: { category: null } }
      );

      res.json({ message: 'Category deleted' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router;