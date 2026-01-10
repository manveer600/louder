/**
 * Generic Web Scraper Service
 * Base scraper with common utilities for all scrapers
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { SCRAPING } = require('../../utils/constants');

class GenericScraperService {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.timeout = SCRAPING.REQUEST_TIMEOUT;
    this.retryAttempts = SCRAPING.RETRY_ATTEMPTS;
    this.retryDelay = SCRAPING.RETRY_DELAY;
  }

  /**
   * Fetch HTML content from URL with retry logic
   */
  async fetchHTML(url, headers = {}) {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...headers
    };

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.debug(`[${this.sourceName}] Fetching ${url} (Attempt ${attempt}/${this.retryAttempts})`);
        
        const response = await axios.get(url, {
          headers: defaultHeaders,
          timeout: this.timeout,
          validateStatus: (status) => status < 500 // Accept 4xx but retry on 5xx
        });

        if (response.status === 200) {
          return response.data;
        }

        if (response.status === 404) {
          logger.warn(`[${this.sourceName}] URL not found: ${url}`);
          return null;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        logger.warn(`[${this.sourceName}] Fetch attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    logger.error(`[${this.sourceName}] Failed to fetch ${url} after ${this.retryAttempts} attempts:`, lastError);
    return null;
  }

  /**
   * Parse HTML content with Cheerio
   */
  parseHTML(html) {
    if (!html) return null;
    return cheerio.load(html);
  }

  /**
   * Normalize date string to Date object
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try parsing common formats
        const formats = [
          /(\d{4})-(\d{2})-(\d{2})/,
          /(\d{2})\/(\d{2})\/(\d{4})/,
          /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i
        ];

        for (const format of formats) {
          const match = dateString.match(format);
          if (match) {
            return new Date(dateString);
          }
        }

        logger.warn(`[${this.sourceName}] Could not parse date: ${dateString}`);
        return null;
      }
      return date;
    } catch (error) {
      logger.warn(`[${this.sourceName}] Date parsing error: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalize time string
   */
  normalizeTime(timeString) {
    if (!timeString) return '';
    return timeString.trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract text from element or selector
   */
  extractText($, element, selector = null) {
    try {
      const target = selector ? $(element).find(selector) : $(element);
      return target.text().trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract attribute from element
   */
  extractAttr($, element, attr) {
    try {
      return $(element).attr(attr) || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Normalize category based on keywords
   */
  normalizeCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categoryMap = {
      'music': 'Music',
      'concert': 'Music',
      'gig': 'Music',
      'sport': 'Sports',
      'match': 'Sports',
      'game': 'Sports',
      'comedy': 'Comedy',
      'standup': 'Comedy',
      'theater': 'Theater',
      'theatre': 'Theater',
      'play': 'Theater',
      'art': 'Arts',
      'exhibition': 'Arts',
      'gallery': 'Arts',
      'tech': 'Technology',
      'technology': 'Technology',
      'workshop': 'Technology',
      'food': 'Food & Drink',
      'drink': 'Food & Drink',
      'wine': 'Food & Drink',
      'business': 'Business',
      'networking': 'Business',
      'conference': 'Business',
      'education': 'Education',
      'learning': 'Education',
      'course': 'Education',
      'health': 'Health & Wellness',
      'wellness': 'Health & Wellness',
      'yoga': 'Health & Wellness',
      'fitness': 'Health & Wellness',
      'family': 'Family',
      'kids': 'Family',
      'children': 'Family'
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Delay helper for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }
}

module.exports = GenericScraperService;

