/**
 * Eventbrite Scraper Service
 * Scrapes events from Eventbrite for Sydney, Australia
 */

const GenericScraperService = require('./genericScraper.service');
const Event = require('../../models/Event.model');
const logger = require('../../utils/logger');
const { TARGET_CITY, CATEGORIES } = require('../../utils/constants');

class EventbriteService extends GenericScraperService {
  constructor() {
    super('Eventbrite');
    this.baseUrl = 'https://www.eventbrite.com.au';
    this.searchUrl = `${this.baseUrl}/d/australia--sydney/all-events/`;
  }

  /**
   * Scrape events from Eventbrite
   */
  async scrapeEvents() {
    logger.info('[Eventbrite] Starting event scraping...');
    const events = [];

    try {
      // Eventbrite uses JavaScript rendering, so we'll need to try multiple approaches
      // For now, we'll scrape from their public event listing pages
      const searchUrls = [
        `${this.searchUrl}?page=1`,
        `${this.searchUrl}?page=2`,
        `${this.searchUrl}?page=3`
      ];

      for (const url of searchUrls) {
        const pageEvents = await this.scrapeEventPage(url);
        if (pageEvents && pageEvents.length > 0) {
          events.push(...pageEvents);
        }
      }

      logger.info(`[Eventbrite] Scraped ${events.length} events`);
      return events;
    } catch (error) {
      logger.error('[Eventbrite] Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape a single event listing page
   */
  async scrapeEventPage(url) {
    const html = await this.fetchHTML(url);
    if (!html) return [];

    const $ = this.parseHTML(html);
    if (!$) return [];

    const events = [];
    
    try {
      // Eventbrite structure - common selectors
      const eventSelectors = [
        'article[data-testid="event-card"]',
        '.event-card',
        '.search-event-card-wrapper',
        '[data-spec="event-card"]'
      ];

      let $events = null;
      for (const selector of eventSelectors) {
        $events = $(selector);
        if ($events.length > 0) {
          logger.debug(`[Eventbrite] Found events using selector: ${selector}`);
          break;
        }
      }

      // Fallback: try to find any event-like elements
      if (!$events || $events.length === 0) {
        $events = $('a[href*="/events/"]').not('[href*="eventbrite.com"]');
        logger.debug(`[Eventbrite] Using fallback selector, found ${$events.length} potential events`);
      }

      if ($events && $events.length > 0) {
        $events.each((index, element) => {
          if (index >= 50) return false; // Limit per page

          try {
            const event = this.parseEventElement($, $(element));
            if (event && event.title && event.date) {
              events.push(event);
            }
          } catch (error) {
            logger.warn(`[Eventbrite] Error parsing event element: ${error.message}`);
          }
        });
      }

      // Alternative: Try to extract from data attributes or structured data
      if (events.length === 0) {
        events.push(...await this.parseStructuredData($));
      }

    } catch (error) {
      logger.error('[Eventbrite] Page parsing error:', error);
    }

    return events;
  }

  /**
   * Parse individual event element
   */
  parseEventElement($, $element) {
    try {
      // Extract event URL - prioritize links with /e/ (specific event pages)
      let eventUrl = this.extractAttr($, $element.find('a[href*="/e/"]').first(), 'href') ||
                      $element.find('a[href*="/e/"]').first().attr('href') ||
                      this.extractAttr($, $element, 'href') || 
                      $element.find('a').first().attr('href') || '';
      
      // Ensure it's a specific event page (contains /e/ for Eventbrite event pages)
      // Not a category page (which would be /d/...)
      if (!eventUrl || (!eventUrl.includes('/e/') && !eventUrl.includes('/events/'))) {
        return null;
      }

      // Build full URL
      let fullUrl = eventUrl.startsWith('http') 
        ? eventUrl 
        : `${this.baseUrl}${eventUrl.startsWith('/') ? eventUrl : '/' + eventUrl}`;
      
      // Ensure URL is from Eventbrite domain
      if (!fullUrl.includes('eventbrite')) {
        logger.warn(`[Eventbrite] Event URL doesn't contain 'eventbrite': ${fullUrl}`);
        return null;
      }

      // Extract title
      const title = this.extractText($, $element, '[data-testid="event-title"]') ||
                   this.extractText($, $element, '.event-card-title') ||
                   this.extractText($, $element, 'h3') ||
                   this.extractText($, $element, 'h2') ||
                   this.extractText($, $element, '.js-d-search-result-card-link') ||
                   this.extractText($, $element);

      // Extract date
      const dateText = this.extractText($, $element, '[data-testid="event-date"]') ||
                      this.extractText($, $element, '.event-date') ||
                      this.extractText($, $element, '.event-card-date');
      
      const date = this.parseDate(dateText);

      // Extract venue
      const venue = this.extractText($, $element, '[data-testid="event-venue"]') ||
                   this.extractText($, $element, '.event-venue') ||
                   this.extractText($, $element, '.event-card-venue') ||
                   'Sydney';

      // Extract image
      const imageUrl = this.extractAttr($, $element, 'data-image') ||
                      this.extractAttr($, $element.find('img').first(), 'src') ||
                      this.extractAttr($, $element.find('img').first(), 'data-src') ||
                      '';

      // Extract description (often not available on listing page)
      const description = this.extractText($, $element, '.event-description') ||
                         this.extractText($, $element, '[data-testid="event-description"]') ||
                         '';

      // Determine category
      const category = this.normalizeCategory(title, description);

      if (!title || !date) {
        return null;
      }

      return {
        title: this.cleanText(title),
        description: this.cleanText(description),
        date: date,
        time: this.normalizeTime(dateText.match(/\d{1,2}:\d{2}/)?.[0] || ''),
        venue: this.cleanText(venue) || TARGET_CITY,
        city: TARGET_CITY,
        category: category,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `${this.baseUrl}${imageUrl}` : ''),
        sourceWebsite: 'Eventbrite',
        originalEventUrl: fullUrl
      };
    } catch (error) {
      logger.warn(`[Eventbrite] Error parsing event element: ${error.message}`);
      return null;
    }
  }

  /**
   * Try to parse structured data (JSON-LD, microdata)
   */
  async parseStructuredData($) {
    const events = [];

    try {
      // Try JSON-LD structured data
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((index, element) => {
        try {
          const jsonData = JSON.parse($(element).html());
          if (jsonData['@type'] === 'Event' || (Array.isArray(jsonData) && jsonData[0]?.['@type'] === 'Event')) {
            const eventData = Array.isArray(jsonData) ? jsonData[0] : jsonData;
            if (eventData.name && eventData.startDate) {
              events.push({
                title: this.cleanText(eventData.name),
                description: this.cleanText(eventData.description || ''),
                date: this.parseDate(eventData.startDate),
                time: this.normalizeTime(eventData.startDate),
                venue: this.cleanText(eventData.location?.name || eventData.location?.address || TARGET_CITY),
                city: TARGET_CITY,
                category: this.normalizeCategory(eventData.name, eventData.description || ''),
                imageUrl: eventData.image || '',
                sourceWebsite: 'Eventbrite',
                originalEventUrl: eventData.url || eventData['@id'] || ''
              });
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      });
    } catch (error) {
      logger.warn('[Eventbrite] Structured data parsing error:', error);
    }

    return events;
  }

  /**
   * Save events to database (handled by main scraping service)
   */
  async saveEvents(events) {
    const savedEvents = [];
    const skippedEvents = [];

    for (const eventData of events) {
      try {
        // Check for duplicates using URL hash
        const urlHash = Event.generateUrlHash(eventData.originalEventUrl);
        const duplicateHash = Event.generateDuplicateHash(
          eventData.title,
          eventData.date,
          eventData.venue
        );

        let existingEvent = await Event.findOne({ urlHash });
        if (!existingEvent) {
          existingEvent = await Event.findOne({ duplicateCheckHash: duplicateHash });
        }

        if (existingEvent) {
          // Update existing event
          Object.assign(existingEvent, eventData);
          existingEvent.urlHash = urlHash;
          existingEvent.duplicateCheckHash = duplicateHash;
          await existingEvent.save();
          skippedEvents.push(existingEvent._id);
          logger.debug(`[Eventbrite] Updated existing event: ${eventData.title}`);
        } else {
          // Create new event
          const newEvent = new Event({
            ...eventData,
            urlHash,
            duplicateCheckHash
          });
          await newEvent.save();
          savedEvents.push(newEvent._id);
          logger.debug(`[Eventbrite] Saved new event: ${eventData.title}`);
        }
      } catch (error) {
        logger.error(`[Eventbrite] Error saving event ${eventData.title}:`, error);
      }
    }

    return { savedEvents, skippedEvents };
  }
}

module.exports = new EventbriteService();

