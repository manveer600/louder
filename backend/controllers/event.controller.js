/**
 * Event Controller
 * Handles event-related API requests
 */

const Event = require('../models/Event.model');
const scrapingOrchestrator = require('../services/scraping/orchestrator.service');
const logger = require('../utils/logger');
const { calculateDistance, getSydneyCenter } = require('../utils/distance');
const { MESSAGES, CATEGORIES } = require('../utils/constants');

class EventController {
  /**
   * Get all events with filters
   */
  async getEvents(req, res, next) {
    try {
      const {
        category,
        dateFrom,
        dateTo,
        source,
        upcomingOnly = 'true',
        page = 1,
        limit = 20,
        sortBy = 'date',
        sortOrder = 'asc',
        latitude,
        longitude,
        radius = 50 // Default radius in kilometers
      } = req.query;

      // Build query
      const query = {};

      // Filter by category
      if (category && CATEGORIES.includes(category)) {
        query.category = category;
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) {
          query.date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.date.$lte = new Date(dateTo);
        }
      } else if (upcomingOnly === 'true') {
        // Default: show only upcoming events
        // Use start of today to avoid timezone issues and match category counts
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.date = { $gte: today };
      }

      // Filter by source
      if (source) {
        query.sourceWebsite = source;
      }

      // Ensure Sydney events only
      query.city = 'Sydney';

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Execute query
      let events, total;
      
      if (latitude && longitude) {
        // Location-based query (Events Near Me)
        // Calculate distance from user location to Sydney center
        const sydneyCenter = getSydneyCenter();
        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);
        const maxRadius = parseFloat(radius) || 50;
        
        const distanceToSydney = calculateDistance(
          userLat,
          userLon,
          sydneyCenter.latitude,
          sydneyCenter.longitude
        );
        
        logger.info(`Location-based query: user at (${userLat}, ${userLon}), distance to Sydney: ${distanceToSydney.toFixed(2)}km, max radius: ${maxRadius}km`);
        
        // If user is too far from Sydney, return no events
        if (distanceToSydney > maxRadius) {
          logger.info(`User is ${distanceToSydney.toFixed(2)}km away from Sydney, which exceeds the ${maxRadius}km radius. Returning no events.`);
          events = [];
          total = 0;
        } else {
          // User is within radius, return Sydney events
          [events, total] = await Promise.all([
            Event.find(query)
              .sort(sort)
              .skip(skip)
              .limit(limitNum)
              .lean(),
            Event.countDocuments(query)
          ]);
          
          logger.info(`User is within ${maxRadius}km radius. Returning ${events.length} events.`);
        }
      } else {
        // Regular query
        [events, total] = await Promise.all([
          Event.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Event.countDocuments(query)
        ]);
      }

      logger.info(`Fetched ${events.length} events (page ${page}, total: ${total})`);

      // Always return success, even if no events found
      res.status(200).json({
        success: true,
        message: total === 0 ? 'No events found. Run scraping to populate events.' : MESSAGES.EVENT_FETCHED,
        data: {
          events: events || [],
          pagination: {
            page: parseInt(page),
            limit: limitNum,
            total: total || 0,
            totalPages: Math.ceil((total || 0) / limitNum) || 1
          }
        }
      });
    } catch (error) {
      logger.error('Get events error:', error);
      next(error);
    }
  }

  /**
   * Get single event by ID
   */
  async getEventById(req, res, next) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: MESSAGES.EVENT_NOT_FOUND
        });
      }

      logger.info(`Fetched event: ${event.title}`);

      res.status(200).json({
        success: true,
        message: MESSAGES.EVENT_FETCHED,
        data: { event }
      });
    } catch (error) {
      logger.error('Get event by ID error:', error);
      next(error);
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(req, res, next) {
    try {
      const stats = await scrapingOrchestrator.getScrapingStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching statistics'
        });
      }

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get event stats error:', error);
      next(error);
    }
  }

  /**
   * Get available categories
   */
  async getCategories(req, res, next) {
    try {
      // Get categories with event counts from database
      // Only count UPCOMING events (matching the default filter)
      // Use start of today to avoid timezone issues
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of today
      
      const categoriesWithCounts = await Event.aggregate([
        { 
          $match: { 
            city: 'Sydney',
            date: { $gte: now } // Only count upcoming events (from today onwards)
          } 
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            name: '$_id',
            count: 1
          }
        }
      ]);
      
      logger.info(`Category counts calculated: ${categoriesWithCounts.length} categories with events`);

      // If no events exist, return all available categories with 0 count
      if (categoriesWithCounts.length === 0) {
        const allCategories = CATEGORIES.map(cat => ({
          name: cat,
          count: 0
        }));

        return res.status(200).json({
          success: true,
          data: {
            categories: allCategories
          }
        });
      }

      // Create a map of existing categories
      const existingCategoriesMap = new Map(
        categoriesWithCounts.map(cat => [cat.name, cat.count])
      );

      // Add all categories, using count from database or 0
      const allCategoriesWithCounts = CATEGORIES.map(cat => ({
        name: cat,
        count: existingCategoriesMap.get(cat) || 0
      }));

      res.status(200).json({
        success: true,
        data: {
          categories: allCategoriesWithCounts
        }
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      next(error);
    }
  }

  /**
   * Trigger manual scraping (admin endpoint)
   * NOTE: GET APIs should NEVER trigger scraping - only this POST endpoint does
   */
  async triggerScraping(req, res, next) {
    try {
      logger.info('Manual scraping triggered via API');

      // Run scraping asynchronously (non-blocking)
      scrapingOrchestrator.scrapeAllSources()
        .then((result) => {
          logger.info('✅ Manual scraping completed:', {
            totalScraped: result.totalScraped,
            totalSaved: result.totalSaved,
            totalUpdated: result.totalUpdated
          });
        })
        .catch((error) => {
          logger.error('❌ Manual scraping failed:', error);
        });

      res.status(202).json({
        success: true,
        message: 'Scraping job started in background',
        data: {
          status: 'processing',
          note: 'Scraping runs asynchronously. Check logs for progress.'
        }
      });
    } catch (error) {
      logger.error('Trigger scraping error:', error);
      next(error);
    }
  }
}

module.exports = new EventController();

