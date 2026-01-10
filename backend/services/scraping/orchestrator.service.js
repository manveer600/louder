/**
 * Scraping Orchestrator Service
 * Coordinates scraping from multiple sources and saves to database
 */

const eventbriteService = require('./eventbrite.service');
const meetupService = require('./meetup.service');
const Event = require('../../models/Event.model');
const logger = require('../../utils/logger');
const { TARGET_CITY } = require('../../utils/constants');

class ScrapingOrchestratorService {
  constructor() {
    this.scrapers = [
      { name: 'Eventbrite', service: eventbriteService },
      { name: 'Meetup', service: meetupService }
    ];
  }

  /**
   * Scrape events from all sources
   */
  async scrapeAllSources() {
    logger.info('Starting scraping from all sources...');
    const results = {
      totalScraped: 0,
      totalSaved: 0,
      totalUpdated: 0,
      errors: [],
      sourceResults: {}
    };

    for (const { name, service } of this.scrapers) {
      try {
        logger.info(`[Orchestrator] Scraping ${name}...`);
        const events = await service.scrapeEvents();

        if (events && events.length > 0) {
          results.totalScraped += events.length;
          logger.info(`[Orchestrator] Scraped ${events.length} events from ${name}`);

          // Save events to database
          const saveResult = await this.saveEvents(events, name);
          results.totalSaved += saveResult.saved;
          results.totalUpdated += saveResult.updated;
          results.sourceResults[name] = {
            scraped: events.length,
            saved: saveResult.saved,
            updated: saveResult.updated,
            errors: saveResult.errors
          };
        } else {
          logger.warn(`[Orchestrator] No events scraped from ${name}`);
          results.sourceResults[name] = {
            scraped: 0,
            saved: 0,
            updated: 0,
            errors: []
          };
        }
      } catch (error) {
        logger.error(`[Orchestrator] Error scraping ${name}:`, error);
        results.errors.push({
          source: name,
          error: error.message
        });
        results.sourceResults[name] = {
          scraped: 0,
          saved: 0,
          updated: 0,
          errors: [error.message]
        };
      }
    }

    logger.info(`[Orchestrator] Scraping completed. Total: ${results.totalScraped} scraped, ${results.totalSaved} saved, ${results.totalUpdated} updated`);
    return results;
  }

  /**
   * Save events to database with duplicate checking
   */
  async saveEvents(events, sourceName) {
    const result = {
      saved: 0,
      updated: 0,
      errors: []
    };

    for (const eventData of events) {
      try {
        // Ensure city is Sydney
        if (!eventData.city || eventData.city.toLowerCase() !== 'sydney') {
          continue; // Skip events not in Sydney
        }

        // Generate hashes for duplicate checking
        const urlHash = Event.generateUrlHash(eventData.originalEventUrl);
        const duplicateHash = Event.generateDuplicateHash(
          eventData.title,
          eventData.date,
          eventData.venue
        );

        // Check for existing event by URL hash first (most reliable)
        let existingEvent = await Event.findOne({ urlHash });

        // If not found, check by duplicate hash (title + date + venue)
        if (!existingEvent) {
          existingEvent = await Event.findOne({ duplicateCheckHash: duplicateHash });
        }

        if (existingEvent) {
          // Update existing event - preserve ID and timestamps
          const updateData = {
            ...eventData,
            urlHash,
            duplicateCheckHash,
            lastUpdated: new Date()
          };

          // Don't overwrite createdAt
          delete updateData.createdAt;

          await Event.updateOne({ _id: existingEvent._id }, { $set: updateData });
          result.updated++;
          logger.debug(`[Orchestrator] Updated existing event: ${eventData.title}`);
        } else {
          // Create new event
          const newEvent = new Event({
            ...eventData,
            urlHash,
            duplicateCheckHash
          });
          await newEvent.save();
          result.saved++;
          logger.debug(`[Orchestrator] Saved new event: ${eventData.title}`);
        }
      } catch (error) {
        const errorMsg = `Error saving event "${eventData.title}": ${error.message}`;
        logger.error(`[Orchestrator] ${errorMsg}`, error);
        result.errors.push(errorMsg);

        // Handle unique constraint violations (duplicate key)
        if (error.code === 11000) {
          logger.warn(`[Orchestrator] Duplicate event detected: ${eventData.title}`);
        }
      }
    }

    return result;
  }

  /**
   * Clean up old events (past events older than 30 days)
   */
  async cleanupOldEvents(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Event.deleteMany({
        date: { $lt: cutoffDate },
        status: 'past'
      });

      logger.info(`[Orchestrator] Cleaned up ${result.deletedCount} old events`);
      return result.deletedCount;
    } catch (error) {
      logger.error('[Orchestrator] Error cleaning up old events:', error);
      return 0;
    }
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats() {
    try {
      const totalEvents = await Event.countDocuments();
      const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() } });
      const pastEvents = await Event.countDocuments({ date: { $lt: new Date() } });
      
      const eventsBySource = await Event.aggregate([
        {
          $group: {
            _id: '$sourceWebsite',
            count: { $sum: 1 }
          }
        }
      ]);

      const eventsByCategory = await Event.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        totalEvents,
        upcomingEvents,
        pastEvents,
        bySource: eventsBySource,
        byCategory: eventsByCategory
      };
    } catch (error) {
      logger.error('[Orchestrator] Error getting scraping stats:', error);
      return null;
    }
  }
}

module.exports = new ScrapingOrchestratorService();

