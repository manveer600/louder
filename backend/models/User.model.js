/**
 * User Model
 * MongoDB schema for email captures from GET TICKETS clicks
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  eventTitle: {
    type: String,
    required: true
  },
  eventUrl: {
    type: String,
    required: true
  },
  consentGiven: {
    type: Boolean,
    required: true,
    default: false
  },
  source: {
    type: String,
    enum: ['event_listing', 'event_detail'],
    default: 'event_listing'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
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

// Indexes for analytics queries
userSchema.index({ email: 1, createdAt: -1 });
userSchema.index({ eventId: 1, createdAt: -1 });
userSchema.index({ consentGiven: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });

// Compound index for duplicate prevention
userSchema.index({ email: 1, eventId: 1 }, { unique: false });

module.exports = mongoose.model('User', userSchema);

