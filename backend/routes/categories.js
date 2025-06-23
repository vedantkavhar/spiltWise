const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

// Create a new category (POST /api/categories)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for this user
    const existing = await Category.findOne({
      name: name.trim(),
      userId: req.user.userId,
    });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name: name.trim(),
      userId: req.user.userId,
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories for the user (GET /api/categories)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.userId }).sort({
      name: 1,
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a category by ID (GET /api/categories/:id)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a category (PUT /api/categories/:id)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if new name is unique for this user
    const existing = await Category.findOne({
      name: name.trim(),
      userId: req.user.userId,
      _id: { $ne: req.params.id },
    });
    if (existing) return res.status(400).json({ message: 'Category name already exists' });

    category.name = name.trim();
    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a category (DELETE /api/categories/:id)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
