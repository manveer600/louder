/**
 * User Routes
 * API routes for user email capture and analytics
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @route   GET /api/v1/users/check-email
 * @desc    Check if email already exists for event
 * @access  Public
 */
router.get('/check-email', userController.checkEmail.bind(userController));

/**
 * @route   POST /api/v1/users/email
 * @desc    Save email for event ticket request
 * @access  Public
 */
router.post('/email', userController.saveEmail.bind(userController));

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get email statistics (admin)
 * @access  Public (should be protected in production)
 */
router.get('/stats', userController.getEmailStats.bind(userController));

module.exports = router;

