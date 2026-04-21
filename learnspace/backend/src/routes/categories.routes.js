const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create({ name, slug, icon, description });
    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

module.exports = router;
