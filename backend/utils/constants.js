/**
 * Application Constants
 * Centralized constants for events, categories, and configuration
 */

module.exports = {
  // Event Categories
  CATEGORIES: [
    'Music',
    'Sports',
    'Comedy',
    'Theater',
    'Arts',
    'Technology',
    'Food & Drink',
    'Business',
    'Education',
    'Health & Wellness',
    'Family',
    'Other'
  ],

  // Scraping Sources
  SOURCES: {
    EVENTBRITE: 'Eventbrite',
    MEETUP: 'Meetup',
    GENERIC: 'Generic'
  },

  // City
  TARGET_CITY: 'Sydney',
  TARGET_COUNTRY: 'Australia',

  // Event Status
  EVENT_STATUS: {
    UPCOMING: 'upcoming',
    PAST: 'past',
    CANCELLED: 'cancelled'
  },

  // Scraping Configuration
  SCRAPING: {
    MAX_EVENTS_PER_SOURCE: 100,
    REQUEST_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 5000 // 5 seconds
  },

  // API Response Messages
  MESSAGES: {
    EVENT_FETCHED: 'Events fetched successfully',
    EVENT_NOT_FOUND: 'Event not found',
    EMAIL_SAVED: 'Email saved successfully',
    INVALID_EMAIL: 'Invalid email address',
    CONSENT_REQUIRED: 'Email consent is required',
    INVALID_DATA: 'Invalid request data'
  },

  // Validation Regex
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

