/**
 * Event Controller
 * Handles event-related API requests
 */

const Event = require('../models/Event.model');
const scrapingOrchestrator = require('../services/scraping/orchestrator.service');
const logger = require('../utils/logger');
const { calculateDistance, getSydneyCenter } = require('../utils/distance');
const { MESSAGES, CATEGORIES } = require('../utils/constants');
const { NODE_ENV } = require('../config/env');

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

      // Build base query (for category counts) - WITHOUT category filter
      // Category counts should be based on the full dataset (with date/location filters)
      const baseQuery = {};

      // Filter by date range
      if (dateFrom || dateTo) {
        baseQuery.date = {};
        if (dateFrom) {
          baseQuery.date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          baseQuery.date.$lte = new Date(dateTo);
        }
      } else if (upcomingOnly === 'true') {
        // Default: show only upcoming events
        // Use UTC to avoid timezone issues
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        baseQuery.date = { $gte: today };
      }

      // Filter by source
      if (source) {
        baseQuery.sourceWebsite = source;
      }

      // Ensure Sydney events only
      baseQuery.city = 'Sydney';

      // Build filtered query (for events list) - INCLUDES category filter
      const filteredQuery = { ...baseQuery };
      
      // Filter by category - normalize for case-insensitive matching
      // This filter is ONLY for the events list, NOT for category counts
      if (category) {
        const normalizedCategory = category.trim();
        // Find matching category (case-insensitive)
        const matchedCategory = CATEGORIES.find(
          cat => cat.toLowerCase() === normalizedCategory.toLowerCase()
        );
        if (matchedCategory) {
          filteredQuery.category = matchedCategory; // Use exact enum value
        }
      }

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Ensure MongoDB connection is ready
      const mongoose = require('mongoose');
      const { ensureConnection } = require('../config/db');
      
      logger.info(`[GetEvents] MongoDB readyState: ${mongoose.connection.readyState}`);
      
      // If not connected, establish connection
      if (mongoose.connection.readyState !== 1) {
        try {
          logger.info('[GetEvents] Connection not ready, establishing...');
          await ensureConnection();
          logger.info(`[GetEvents] Connection established. ReadyState: ${mongoose.connection.readyState}`);
        } catch (error) {
          logger.error('[GetEvents] Failed to ensure MongoDB connection:', error);
          return res.status(503).json({
            success: false,
            message: 'Database connection not available. Please try again in a moment.',
            error: NODE_ENV === 'development' ? error.message : 'Database connection failed'
          });
        }
      }

      // Execute query for events list (uses filteredQuery which includes category filter)
      let events, total;
      
      if (latitude && longitude) {
        // Location-based query (Events Near Me)
        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);
        const maxRadius = parseFloat(radius) || 50; // Default 50km radius
        
        logger.info(`Location-based query: user at (${userLat}, ${userLon}), max radius: ${maxRadius}km`);
        
        // Get all events matching the filtered query (includes category filter)
        const allEvents = await Event.find(filteredQuery).lean().maxTimeMS(10000);
        
        // Filter events by distance from user location
        const nearbyEvents = [];
        for (const event of allEvents) {
          let eventLat, eventLon;
          
          // If event has coordinates, use them
          if (event.latitude && event.longitude) {
            eventLat = event.latitude;
            eventLon = event.longitude;
          } else {
            // Fallback: use Sydney center coordinates for events without specific location
            const sydneyCenter = getSydneyCenter();
            eventLat = sydneyCenter.latitude;
            eventLon = sydneyCenter.longitude;
          }
          
          const distance = calculateDistance(userLat, userLon, eventLat, eventLon);
          
          if (distance <= maxRadius) {
            nearbyEvents.push(event);
          }
        }
        
        // Apply sorting and pagination to filtered results
        nearbyEvents.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (sortOrder === 'desc') {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
        
        total = nearbyEvents.length;
        events = nearbyEvents.slice(skip, skip + limitNum);
        
        logger.info(`Found ${total} events within ${maxRadius}km radius. Returning ${events.length} events for page ${page}.`);
      } else {
        // Regular query (uses filteredQuery which includes category filter)
        [events, total] = await Promise.all([
          Event.find(filteredQuery)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Event.countDocuments(filteredQuery)
        ]);
      }

      logger.info(`Fetched ${events.length} events (page ${page}, total: ${total})`);

      // Calculate category counts from BASE query (without category filter)
      // Category counts should reflect the full dataset, not the filtered category
      // This ensures clicking a category doesn't change other category counts
      let categoryCounts = {};
      
      if (latitude && longitude) {
        // For location-based queries, count from base query (no category filter)
        const allBaseEvents = await Event.find(baseQuery).lean().maxTimeMS(10000);
        const baseNearbyEvents = [];
        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);
        const maxRadius = parseFloat(radius) || 50;
        
        for (const event of allBaseEvents) {
          let eventLat, eventLon;
          if (event.latitude && event.longitude) {
            eventLat = event.latitude;
            eventLon = event.longitude;
          } else {
            const sydneyCenter = getSydneyCenter();
            eventLat = sydneyCenter.latitude;
            eventLon = sydneyCenter.longitude;
          }
          const distance = calculateDistance(userLat, userLon, eventLat, eventLon);
          if (distance <= maxRadius) {
            baseNearbyEvents.push(event);
          }
        }
        
        // Count categories from base events (no category filter) - normalize to match enum values
        baseNearbyEvents.forEach(event => {
          let cat = (event.category || 'Other').trim();
          // Normalize category to match enum (case-insensitive)
          const matchedCategory = CATEGORIES.find(
            c => c.toLowerCase() === cat.toLowerCase()
          );
          cat = matchedCategory || 'Other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      } else {
        // For regular queries, count from base query (no category filter, before pagination)
        const allBaseEvents = await Event.find(baseQuery).lean().maxTimeMS(10000);
        allBaseEvents.forEach(event => {
          let cat = (event.category || 'Other').trim();
          // Normalize category to match enum (case-insensitive)
          const matchedCategory = CATEGORIES.find(
            c => c.toLowerCase() === cat.toLowerCase()
          );
          cat = matchedCategory || 'Other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
      
      // Normalize category counts to match CATEGORIES enum format
      // ALWAYS return all categories, even with 0 count
      const normalizedCategoryCounts = CATEGORIES.map(cat => ({
        name: cat,
        count: categoryCounts[cat] || 0
      }));

      logger.info(`Category counts calculated from BASE dataset (without category filter):`, normalizedCategoryCounts);
      logger.info(`Events fetched from FILTERED dataset (with category filter): ${total} events`);
      logger.info(`Category filter applied: ${category || 'none'}`);

      // Always return success, even if no events found
      // ALWAYS include categoryCounts in response (even when no events or no filters)
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
          },
          categoryCounts: normalizedCategoryCounts // Always included, calculated from filtered dataset
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
      // Ensure MongoDB connection is ready
      const mongoose = require('mongoose');
      const { ensureConnection } = require('../config/db');
      
      logger.info(`[Categories] MongoDB readyState: ${mongoose.connection.readyState}`);
      
      // If not connected, establish connection
      if (mongoose.connection.readyState !== 1) {
        try {
          logger.info('[Categories] Connection not ready, establishing...');
          await ensureConnection();
          logger.info(`[Categories] Connection established. ReadyState: ${mongoose.connection.readyState}`);
          
          // Wait a bit for connection to fully stabilize
          if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          logger.error('[Categories] Failed to ensure MongoDB connection:', error);
          logger.error('[Categories] Connection error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          return res.status(503).json({
            success: false,
            message: 'Database connection not available. Please try again in a moment.',
            error: NODE_ENV === 'development' ? error.message : 'Database connection failed'
          });
        }
      }

      // Get categories with event counts from database
      // Count ALL events (not filtered by date) to show total available in each category
      // Date filtering is handled in getEvents endpoint
      
      logger.info(`[Categories] Starting category count...`);
      
      let totalEvents;
      try {
        totalEvents = await Event.countDocuments({ city: 'Sydney' }).maxTimeMS(10000);
        logger.info(`[Categories] Total Sydney events: ${totalEvents}`);
      } catch (countError) {
        logger.error(`[Categories] Error counting events:`, countError);
        throw new Error(`Failed to count events: ${countError.message}`);
      }
      
      // Count all events by category (no date filter)
      let categoriesWithCounts;
      try {
        logger.info(`[Categories] Starting aggregation...`);
        categoriesWithCounts = await Event.aggregate([
          { 
            $match: { 
              city: 'Sydney'
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
        ]).option({ maxTimeMS: 10000 }); // 10 second timeout for aggregation
        
        logger.info(`[Categories] Aggregation completed. Found ${categoriesWithCounts.length} categories with events`);
      } catch (aggError) {
        logger.error(`[Categories] Aggregation error:`, aggError);
        logger.error(`[Categories] Aggregation error details:`, {
          name: aggError.name,
          message: aggError.message,
          stack: aggError.stack
        });
        throw new Error(`Failed to aggregate categories: ${aggError.message}`);
      }
      
      if (categoriesWithCounts.length > 0) {
        logger.info(`[Categories] Category counts:`, JSON.stringify(categoriesWithCounts, null, 2));
      }

      // If no events exist, return all available categories with 0 count
      if (categoriesWithCounts.length === 0) {
        logger.info(`[Categories] No events found, returning all categories with 0 count`);
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
      logger.error('❌ Get categories error:', error);
      logger.error('Error name:', error.name);
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
      
      // Check if it's a connection error
      if (error.message && error.message.includes('buffering timed out')) {
        return res.status(503).json({
          success: false,
          message: 'Database connection timeout. Please try again in a moment.',
          error: 'Connection timeout'
        });
      }
      
      // Return error response instead of throwing to prevent 500
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: NODE_ENV === 'development' ? error.message : 'Internal server error',
        ...(NODE_ENV === 'development' && { stack: error.stack })
      });
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

