/**
 * User Controller
 * Handles user email capture and analytics
 */

const mongoose = require('mongoose');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const { MESSAGES, EMAIL_REGEX } = require('../utils/constants');

class UserController {
  /**
   * Check if email already exists for event
   */
  async checkEmail(req, res, next) {
    try {
      // Ensure MongoDB connection is ready
      const { ensureConnection } = require('../config/db');
      try {
        await ensureConnection();
      } catch (error) {
        logger.error('[CheckEmail] Failed to ensure MongoDB connection:', error);
        return res.status(503).json({
          success: false,
          message: 'Database connection not available. Please try again in a moment.',
          error: 'Database connection failed'
        });
      }

      const { email, eventId } = req.query;

      if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          success: false,
          message: MESSAGES.INVALID_EMAIL
        });
      }

      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Event ID'
        });
      }

      const checkResult = await emailService.checkEmailExists(email, eventId);

      res.status(200).json({
        success: true,
        data: {
          exists: checkResult.exists,
          event: checkResult.exists ? {
            originalEventUrl: checkResult.interest.originalEventUrl
          } : null
        }
      });
    } catch (error) {
      logger.error('Check email error:', error);
      next(error);
    }
  }

  /**
   * Save email for event ticket request
   */
  async saveEmail(req, res, next) {
    try {
      // Ensure MongoDB connection is ready
      const { ensureConnection } = require('../config/db');
      try {
        await ensureConnection();
      } catch (error) {
        logger.error('[SaveEmail] Failed to ensure MongoDB connection:', error);
        return res.status(503).json({
          success: false,
          message: 'Database connection not available. Please try again in a moment.',
          error: 'Database connection failed'
        });
      }

      const { email, eventId, consentGiven } = req.body;

      // Validation
      if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          success: false,
          message: MESSAGES.INVALID_EMAIL
        });
      }

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Event ID format'
        });
      }

      if (consentGiven !== true) {
        return res.status(400).json({
          success: false,
          message: MESSAGES.CONSENT_REQUIRED
        });
      }

      // Get IP address and user agent for analytics
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.get('user-agent') || '';

      // Save email
      const result = await emailService.saveEmail({
        email,
        eventId,
        consentGiven,
        source: 'event_listing',
        ipAddress,
        userAgent,
        metadata: {
          referer: req.get('referer') || '',
          timestamp: new Date().toISOString()
        }
      });

      if (result.alreadyExists) {
        logger.info(`Email already exists: ${email} for event ${eventId}`);
        return res.status(200).json({
          success: true,
          message: 'Email already registered for this event',
          alreadyExists: true,
          data: {
            event: result.event
          }
        });
      }

      logger.info(`Email saved: ${email} for event ${eventId}`);

      res.status(201).json({
        success: true,
        message: MESSAGES.EMAIL_SAVED,
        alreadyExists: false,
        data: {
          interest: result.interest,
          event: result.event
        }
      });
    } catch (error) {
      logger.error('Save email error:', error);
      
      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Get email statistics (admin endpoint)
   */
  async getEmailStats(req, res, next) {
    try {
      // Ensure MongoDB connection is ready
      const { ensureConnection } = require('../config/db');
      try {
        await ensureConnection();
      } catch (error) {
        logger.error('[GetEmailStats] Failed to ensure MongoDB connection:', error);
        return res.status(503).json({
          success: false,
          message: 'Database connection not available. Please try again in a moment.',
          error: 'Database connection failed'
        });
      }

      const stats = await emailService.getEmailStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching email statistics'
        });
      }

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get email stats error:', error);
      next(error);
    }
  }
}

module.exports = new UserController();

