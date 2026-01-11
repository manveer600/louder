/**
 * Email Service
 * Handles email capture and storage for analytics/marketing
 */

const User = require('../models/User.model');
const Event = require('../models/Event.model');
const logger = require('../utils/logger');
const { EMAIL_REGEX } = require('../utils/constants');
const { sendConfirmationEmail } = require('./emailSender.service');

class EmailService {
  /**
   * Save email with consent for event ticket request
   */
  async saveEmail(data) {
    try {
      const { email, eventId, consentGiven, source = 'event_listing', ipAddress, userAgent, metadata } = data;

      // Validate email
      if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email address');
      }

      // Validate consent
      if (!consentGiven) {
        throw new Error('Email consent is required');
      }

      // Validate event exists
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Create user record (allow multiple entries for same email + event for analytics)
      const user = new User({
        email: email.toLowerCase().trim(),
        eventId: event._id,
        eventTitle: event.title,
        eventUrl: event.originalEventUrl,
        consentGiven: consentGiven,
        source: source,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        metadata: metadata || {}
      });

      await user.save();

      logger.info(`Email saved for event ${eventId}: ${email}`);

      // Send confirmation email (fire and forget - don't block response)
      sendConfirmationEmail(email, event)
        .then(result => {
          if (result.success) {
            logger.info(`✅ Confirmation email sent to ${email} for event: ${event.title}`);
            logger.info(`   Message ID: ${result.messageId}`);
          } else {
            if (result.configured === false) {
              logger.warn(`⚠️  Email not configured. To enable email sending:`);
              logger.warn(`   1. Add SMTP credentials to backend/.env`);
              logger.warn(`   2. See EMAIL_SETUP.md for instructions`);
              logger.warn(`   Email: ${email}, Event: ${event.title}`);
            } else {
              logger.error(`❌ Failed to send confirmation email to ${email}:`);
              logger.error(`   Error: ${result.error || result.message}`);
              logger.error(`   Code: ${result.code || 'Unknown'}`);
            }
          }
        })
        .catch(error => {
          logger.error(`❌ Error sending confirmation email to ${email}:`, error);
          // Don't throw - email sending failure shouldn't break the user flow
        });

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          eventId: user.eventId,
          consentGiven: user.consentGiven
        },
        event: {
          id: event._id,
          title: event.title,
          originalEventUrl: event.originalEventUrl
        }
      };
    } catch (error) {
      logger.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    try {
      const totalEmails = await User.countDocuments();
      const emailsWithConsent = await User.countDocuments({ consentGiven: true });
      const emailsWithoutConsent = await User.countDocuments({ consentGiven: false });

      const emailsByEvent = await User.aggregate([
        {
          $group: {
            _id: '$eventId',
            count: { $sum: 1 },
            consents: { $sum: { $cond: ['$consentGiven', 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'events',
            localField: '_id',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $project: {
            eventTitle: '$event.title',
            count: 1,
            consents: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      return {
        totalEmails,
        emailsWithConsent,
        emailsWithoutConsent,
        topEvents: emailsByEvent
      };
    } catch (error) {
      logger.error('Error getting email stats:', error);
      return null;
    }
  }
}

module.exports = new EmailService();

