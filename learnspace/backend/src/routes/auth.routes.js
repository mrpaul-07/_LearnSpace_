// ============================================================
// LearnSpace - Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, refreshToken, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'instructor']).withMessage('Invalid role')
], validate, register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validate, login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], validate, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
