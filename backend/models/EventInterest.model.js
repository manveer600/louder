/**
 * Event Interest Model
 * Tracks user email submissions for events (prevents duplicates)
 */

const mongoose = require('mongoose');

const eventInterestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  sourceWebsite: {
    type: String,
    required: true,
    enum: ['Eventbrite', 'Meetup', 'Generic']
  },
  originalEventUrl: {
    type: String,
    required: true
  },
  consentGiven: {
    type: Boolean,
    required: true,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique compound index: one email per event
eventInterestSchema.index({ email: 1, eventId: 1 }, { unique: true });

// Indexes for queries
eventInterestSchema.index({ email: 1, createdAt: -1 });
eventInterestSchema.index({ eventId: 1, createdAt: -1 });
eventInterestSchema.index({ sourceWebsite: 1, createdAt: -1 });

module.exports = mongoose.model('EventInterest', eventInterestSchema);
