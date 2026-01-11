/**
 * Email Service
 * Handles email capture and storage for analytics/marketing
 */

const User = require('../models/User.model');
const Event = require('../models/Event.model');
const EventInterest = require('../models/EventInterest.model');
const logger = require('../utils/logger');
const { EMAIL_REGEX } = require('../utils/constants');
const { sendConfirmationEmail } = require('./emailSender.service');

class EmailService {
  /**
   * Check if email already exists for this event
   */
  async checkEmailExists(email, eventId) {
    try {
      const interest = await EventInterest.findOne({
        email: email.toLowerCase().trim(),
        eventId: eventId
      });

      return interest ? {
        exists: true,
        interest: interest
      } : {
        exists: false
      };
    } catch (error) {
      logger.error('Error checking email existence:', error);
      return { exists: false };
    }
  }

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

      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists for this event
      const existingInterest = await EventInterest.findOne({
        email: normalizedEmail,
        eventId: eventId
      });

      if (existingInterest) {
        logger.info(`Email ${normalizedEmail} already registered for event ${eventId}`);
        return {
          success: true,
          alreadyExists: true,
          event: {
            id: event._id,
            title: event.title,
            originalEventUrl: event.originalEventUrl
          }
        };
      }

      // Create EventInterest record (prevents duplicates)
      const eventInterest = new EventInterest({
        email: normalizedEmail,
        eventId: event._id,
        sourceWebsite: event.sourceWebsite,
        originalEventUrl: event.originalEventUrl,
        consentGiven: consentGiven,
        emailSent: false,
        metadata: {
          ipAddress: ipAddress || '',
          userAgent: userAgent || '',
          source: source,
          ...metadata
        }
      });

      await eventInterest.save();

      // Also save to User collection for analytics (allow duplicates here for tracking)
      const user = new User({
        email: normalizedEmail,
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

      logger.info(`Email saved for event ${eventId}: ${normalizedEmail}`);

      // Send confirmation email after saving to database
      let emailSent = false;
      let emailError = null;
      
      try {
        const emailResult = await sendConfirmationEmail(normalizedEmail, event);
        
        if (emailResult.success) {
          // Mark email as sent
          eventInterest.emailSent = true;
          await eventInterest.save();
          emailSent = true;
          
          logger.info(`✅ Confirmation email sent to ${normalizedEmail} for event: ${event.title}`);
          logger.info(`   Message ID: ${emailResult.messageId}`);
        } else {
          emailError = emailResult.error || emailResult.message;
          
          if (emailResult.configured === false) {
            logger.warn(`⚠️  Email not configured. To enable email sending:`);
            logger.warn(`   Add USER and APP_PASSWORD to backend/.env`);
            logger.warn(`   Email: ${normalizedEmail}, Event: ${event.title}`);
          } else {
            logger.error(`❌ Failed to send confirmation email to ${normalizedEmail}:`);
            logger.error(`   Error: ${emailError}`);
          }
        }
      } catch (error) {
        emailError = error.message;
        logger.error(`❌ Error sending confirmation email to ${normalizedEmail}:`, error);
        // Don't throw - email sending failure shouldn't break the user flow
        // Email is still saved in database, just not sent
      }

      return {
        success: true,
        alreadyExists: false,
        emailSent: emailSent,
        emailError: emailError || undefined,
        interest: {
          id: eventInterest._id,
          email: eventInterest.email,
          eventId: eventInterest.eventId
        },
        event: {
          id: event._id,
          title: event.title,
          originalEventUrl: event.originalEventUrl
        }
      };
    } catch (error) {
      logger.error('Email service error:', error);
      
      // Handle duplicate key error (shouldn't happen with our check, but just in case)
      if (error.code === 11000) {
        logger.warn('Duplicate email detected (race condition)');
        return {
          success: true,
          alreadyExists: true,
          event: {
            id: eventId,
            originalEventUrl: data.originalEventUrl || ''
          }
        };
      }
      
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

