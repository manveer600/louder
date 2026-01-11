/**
 * User Routes
 * API routes for user email capture and analytics
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { ensureDBConnection } = require('../middlewares/db.middleware');

/**
 * @route   GET /api/v1/users/check-email
 * @desc    Check if email already exists for event
 * @access  Public
 */
router.get('/check-email', ensureDBConnection, userController.checkEmail.bind(userController));

/**
 * @route   POST /api/v1/users/email
 * @desc    Save email for event ticket request
 * @access  Public
 */
router.post('/email', ensureDBConnection, userController.saveEmail.bind(userController));

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get email statistics (admin)
 * @access  Public (should be protected in production)
 */
router.get('/stats', ensureDBConnection, userController.getEmailStats.bind(userController));

module.exports = router;

