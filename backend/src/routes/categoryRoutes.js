const router = require('express').Router();
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { syncCategoryEnum } = require('../utils/categoryHelper');

// GET all categories (Publicly accessible so unregistered staff can fetch it during sign-up)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to retrieve categories.' });
  }
});

// POST to create a new category (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    const trimmedName = name.trim();
    
    // Case-insensitive duplicate check
    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const newCategory = await Category.create({ name: trimmedName });
    await syncCategoryEnum();

    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create category.' });
  }
});

// DELETE a category (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const User = mongoose.model('User');
    const Complaint = mongoose.model('Complaint');

    // Check if category is currently used by any staff or complaints
    const isUsedByStaff = await User.exists({ role: 'STAFF', category: category.name });
    const isUsedByComplaint = await Complaint.exists({ category: category.name });

    if (isUsedByStaff || isUsedByComplaint) {
      return res.status(400).json({ message: 'Cannot delete category because it is assigned to staff or complaints.' });
    }

    await Category.findByIdAndDelete(req.params.id);
    await syncCategoryEnum();

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete category.' });
  }
});

module.exports = router;
