/**
 * Meetup Scraper Service
 * Scrapes events from Meetup for Sydney, Australia
 */

const GenericScraperService = require('./genericScraper.service');
const Event = require('../../models/Event.model');
const logger = require('../../utils/logger');
const { TARGET_CITY, CATEGORIES } = require('../../utils/constants');

class MeetupService extends GenericScraperService {
  constructor() {
    super('Meetup');
    this.baseUrl = 'https://www.meetup.com';
    this.apiBaseUrl = 'https://api.meetup.com';
  }

  /**
   * Scrape events from Meetup
   * Note: Meetup has an API but requires auth. We'll use web scraping for public events.
   */
  async scrapeEvents() {
    logger.info('[Meetup] Starting event scraping...');
    const events = [];

    try {
      // Meetup events in Sydney - try different approaches
      const searchUrls = [
        `${this.baseUrl}/find/events/?location=australia--sydney`,
        `${this.baseUrl}/events/sydney-australia/`,
      ];

      for (const url of searchUrls) {
        const pageEvents = await this.scrapeEventPage(url);
        if (pageEvents && pageEvents.length > 0) {
          events.push(...pageEvents);
        }
      }

      logger.info(`[Meetup] Scraped ${events.length} events`);
      return events;
    } catch (error) {
      logger.error('[Meetup] Scraping error:', error);
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
      // Meetup structure - common selectors
      const eventSelectors = [
        '[data-testid="event-card"]',
        '.event-listing-container',
        '.eventCard',
        'article[data-event-id]',
        '.event-item'
      ];

      let $events = null;
      for (const selector of eventSelectors) {
        $events = $(selector);
        if ($events.length > 0) {
          logger.debug(`[Meetup] Found events using selector: ${selector}`);
          break;
        }
      }

      // Fallback: look for event links
      if (!$events || $events.length === 0) {
        $events = $('a[href*="/events/"]').filter((i, el) => {
          const href = $(el).attr('href');
          return href && href.includes('/events/') && !href.includes('meetup.com');
        });
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
            logger.warn(`[Meetup] Error parsing event element: ${error.message}`);
          }
        });
      }

      // Try structured data
      if (events.length === 0) {
        events.push(...await this.parseStructuredData($));
      }

    } catch (error) {
      logger.error('[Meetup] Page parsing error:', error);
    }

    return events;
  }

  /**
   * Parse individual event element
   */
  parseEventElement($, $element) {
    try {
      // Extract event URL
      const eventUrl = this.extractAttr($, $element, 'href') ||
                      $element.find('a').first().attr('href') ||
                      $element.closest('a').attr('href') || '';

      if (!eventUrl || !eventUrl.includes('/events/')) {
        return null;
      }

      const fullUrl = eventUrl.startsWith('http')
        ? eventUrl
        : `${this.baseUrl}${eventUrl.startsWith('/') ? eventUrl : '/' + eventUrl}`;

      // Extract title
      const title = this.extractText($, $element, '[data-testid="event-title"]') ||
                   this.extractText($, $element, '.eventCard--link') ||
                   this.extractText($, $element, '.event-title') ||
                   this.extractText($, $element, 'h3') ||
                   this.extractText($, $element, 'h2') ||
                   this.extractText($, $element, '.eventCardHead--title');

      // Extract date
      const dateText = this.extractText($, $element, '[data-testid="event-date"]') ||
                      this.extractText($, $element, '.eventCard--date') ||
                      this.extractText($, $element, '.event-time') ||
                      this.extractAttr($, $element, 'data-event-time');

      const date = this.parseDate(dateText);

      // Extract venue
      const venue = this.extractText($, $element, '[data-testid="event-venue"]') ||
                   this.extractText($, $element, '.eventCard--venue') ||
                   this.extractText($, $element, '.event-location') ||
                   this.extractText($, $element, '.venueDisplay') ||
                   'Sydney';

      // Extract image
      const imageUrl = this.extractAttr($, $element.find('img').first(), 'src') ||
                      this.extractAttr($, $element.find('img').first(), 'data-src') ||
                      this.extractAttr($, $element, 'data-image') ||
                      '';

      // Extract description
      const description = this.extractText($, $element, '.eventCard--description') ||
                         this.extractText($, $element, '.event-description') ||
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
        sourceWebsite: 'Meetup',
        originalEventUrl: fullUrl
      };
    } catch (error) {
      logger.warn(`[Meetup] Error parsing event element: ${error.message}`);
      return null;
    }
  }

  /**
   * Try to parse structured data
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
                sourceWebsite: 'Meetup',
                originalEventUrl: eventData.url || eventData['@id'] || ''
              });
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      });
    } catch (error) {
      logger.warn('[Meetup] Structured data parsing error:', error);
    }

    return events;
  }

  /**
   * Save events to database
   */
  async saveEvents(events) {
    const savedEvents = [];
    const skippedEvents = [];

    for (const eventData of events) {
      try {
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
          Object.assign(existingEvent, eventData);
          existingEvent.urlHash = urlHash;
          existingEvent.duplicateCheckHash = duplicateHash;
          await existingEvent.save();
          skippedEvents.push(existingEvent._id);
          logger.debug(`[Meetup] Updated existing event: ${eventData.title}`);
        } else {
          const newEvent = new Event({
            ...eventData,
            urlHash,
            duplicateCheckHash
          });
          await newEvent.save();
          savedEvents.push(newEvent._id);
          logger.debug(`[Meetup] Saved new event: ${eventData.title}`);
        }
      } catch (error) {
        logger.error(`[Meetup] Error saving event ${eventData.title}:`, error);
      }
    }

    return { savedEvents, skippedEvents };
  }
}

module.exports = new MeetupService();

