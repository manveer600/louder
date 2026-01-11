/**
 * Event Routes
 * API routes for event-related endpoints
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { ensureDBConnection } = require('../middlewares/db.middleware');
const { API_VERSION } = require('../config/env');

/**
 * @route   GET /api/v1/events
 * @desc    Get all events with filters
 * @access  Public
 */
router.get('/', ensureDBConnection, eventController.getEvents.bind(eventController));

/**
 * @route   GET /api/v1/events/categories
 * @desc    Get available categories with counts
 * @access  Public
 */
router.get('/categories', ensureDBConnection, eventController.getCategories.bind(eventController));

/**
 * @route   GET /api/v1/events/stats
 * @desc    Get event statistics
 * @access  Public
 */
router.get('/stats', ensureDBConnection, eventController.getEventStats.bind(eventController));

/**
 * @route   GET /api/v1/events/:id
 * @desc    Get single event by ID
 * @access  Public
 */
router.get('/:id', ensureDBConnection, eventController.getEventById.bind(eventController));

/**
 * @route   POST /api/v1/events/scrape
 * @desc    Trigger manual scraping (admin)
 * @access  Public (should be protected in production)
 */
router.post('/scrape', eventController.triggerScraping.bind(eventController));

module.exports = router;

