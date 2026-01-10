/**
 * Event Model
 * MongoDB schema for events scraped from various sources
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    default: 'Sydney',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
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
    index: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  sourceWebsite: {
    type: String,
    required: true,
    enum: ['Eventbrite', 'Meetup', 'Generic'],
    index: true
  },
  originalEventUrl: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  urlHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  duplicateCheckHash: {
    type: String,
    required: true,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
eventSchema.index({ date: 1, city: 1 });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ sourceWebsite: 1, lastUpdated: 1 });
eventSchema.index({ duplicateCheckHash: 1 });

// Virtual for event status (upcoming/past)
eventSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.date < now) {
    return 'past';
  }
  return 'upcoming';
});

// Static method to generate URL hash
eventSchema.statics.generateUrlHash = function(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
};

// Static method to generate duplicate check hash (title + date + venue)
eventSchema.statics.generateDuplicateHash = function(title, date, venue) {
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedVenue = venue.toLowerCase().trim();
  const dateStr = new Date(date).toISOString().split('T')[0];
  const combined = `${normalizedTitle}|${dateStr}|${normalizedVenue}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// Pre-save hook to ensure hashes are set
eventSchema.pre('save', function(next) {
  if (!this.urlHash) {
    this.urlHash = this.constructor.generateUrlHash(this.originalEventUrl);
  }
  if (!this.duplicateCheckHash) {
    this.duplicateCheckHash = this.constructor.generateDuplicateHash(
      this.title,
      this.date,
      this.venue
    );
  }
  this.lastUpdated = new Date();
  next();
});

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  return this.date > new Date();
};

module.exports = mongoose.model('Event', eventSchema);

