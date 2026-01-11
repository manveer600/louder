/**
 * Export Controller
 * Handles data export functionality (CSV/Excel)
 */

const EventInterest = require('../models/EventInterest.model');
const Event = require('../models/Event.model');
const logger = require('../utils/logger');
const { ensureConnection } = require('../config/db');
const { NODE_ENV } = require('../config/env');

class ExportController {
  /**
   * Export user-event analytics data
   * Format: CSV
   * Fields: User email, Event name, Event source, Registration timestamp
   */
  async exportAnalytics(req, res, next) {
    try {
      await ensureConnection();

      const { format = 'csv' } = req.query;

      // Fetch all event interests with populated event data
      const interests = await EventInterest.find({})
        .populate('eventId', 'title sourceWebsite originalEventUrl')
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(30000);

      logger.info(`Exporting ${interests.length} records in ${format} format`);

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'User Email',
          'Event Name',
          'Event Source',
          'Event URL',
          'Registration Timestamp',
          'Consent Given'
        ];

        const csvRows = interests.map(interest => {
          const event = interest.eventId || {};
          return [
            interest.email || '',
            event.title || 'N/A',
            event.sourceWebsite || interest.sourceWebsite || 'N/A',
            event.originalEventUrl || interest.originalEventUrl || 'N/A',
            interest.createdAt ? new Date(interest.createdAt).toISOString() : '',
            interest.consentGiven ? 'Yes' : 'No'
          ].map(field => {
            // Escape CSV special characters
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          });
        });

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="louder-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvContent);

      } else {
        // JSON format (fallback)
        res.status(200).json({
          success: true,
          data: interests.map(interest => ({
            email: interest.email,
            eventName: interest.eventId?.title || 'N/A',
            eventSource: interest.eventId?.sourceWebsite || interest.sourceWebsite || 'N/A',
            eventUrl: interest.eventId?.originalEventUrl || interest.originalEventUrl || 'N/A',
            registrationTimestamp: interest.createdAt,
            consentGiven: interest.consentGiven
          })),
          total: interests.length
        });
      }
    } catch (error) {
      logger.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new ExportController();
