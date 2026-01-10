/**
 * User Controller
 * Handles user email capture and analytics
 */

const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const { MESSAGES, EMAIL_REGEX } = require('../utils/constants');

class UserController {
  /**
   * Save email for event ticket request
   */
  async saveEmail(req, res, next) {
    try {
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

      logger.info(`Email saved: ${email} for event ${eventId}`);

      res.status(201).json({
        success: true,
        message: MESSAGES.EMAIL_SAVED,
        data: {
          user: result.user,
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

