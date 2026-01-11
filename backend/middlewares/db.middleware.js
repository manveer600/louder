/**
 * Database Connection Middleware
 * Ensures MongoDB connection is ready before processing requests
 */

const { ensureConnection } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Middleware to ensure database connection before processing request
 */
const ensureDBConnection = async (req, res, next) => {
  try {
    await ensureConnection();
    next();
  } catch (error) {
    logger.error('[DB Middleware] Connection failed:', error);
    return res.status(503).json({
      success: false,
      message: 'Database connection not available. Please try again in a moment.',
      error: 'Database connection failed'
    });
  }
};

module.exports = {
  ensureDBConnection
};
