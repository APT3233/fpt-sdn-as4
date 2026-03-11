// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (must be logged in)
router.get('/me', protect, authController.getMe);

// Admin-only routes
router.get('/users', protect, restrictTo('admin'), authController.getAllUsers);

module.exports = router;
