/**
 * Export Routes
 * API routes for data export functionality
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { ensureDBConnection } = require('../middlewares/db.middleware');

/**
 * @route   GET /api/v1/export/analytics
 * @desc    Export user-event analytics data (CSV/JSON)
 * @access  Public (should be protected in production)
 * @query   format: csv (default) or json
 */
router.get('/analytics', ensureDBConnection, exportController.exportAnalytics.bind(exportController));

module.exports = router;
