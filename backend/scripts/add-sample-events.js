/**
 * Add Sample Events Script
 * Adds sample events to the database for testing
 * Usage: node scripts/add-sample-events.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event.model');
const { MONGODB_URI } = require('../config/env');

// Helper to get future dates (30-60 days from now)
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const sampleEvents = [
  {
    title: 'Sydney Music Festival 2024',
    description: 'Join us for an amazing music festival featuring top artists from around the world. A weekend of great music, food, and fun in Sydney!',
    date: getFutureDate(45),
    time: '18:00',
    venue: 'Centennial Park',
    city: 'Sydney',
    category: 'Music',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/music-events/'
  },
  {
    title: 'Sydney FC vs Melbourne Victory',
    description: 'Watch Sydney FC take on Melbourne Victory in this thrilling A-League match. Don\'t miss the action!',
    date: getFutureDate(40),
    time: '19:30',
    venue: 'Allianz Stadium',
    city: 'Sydney',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/sports-events/'
  },
  {
    title: 'Stand-Up Comedy Night',
    description: 'Laugh the night away with Australia\'s best comedians. A night of non-stop laughter and entertainment.',
    date: getFutureDate(38),
    time: '20:00',
    venue: 'The Comedy Store Sydney',
    city: 'Sydney',
    category: 'Comedy',
    imageUrl: 'https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=800',
    sourceWebsite: 'Meetup',
    originalEventUrl: 'https://www.meetup.com/find/events/?location=australia--sydney&categoryId=10'
  },
  {
    title: 'Sydney Opera House: The Phantom of the Opera',
    description: 'Experience the timeless musical masterpiece at the iconic Sydney Opera House. A night of drama and romance.',
    date: getFutureDate(50),
    time: '19:00',
    venue: 'Sydney Opera House',
    city: 'Sydney',
    category: 'Theater',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/theater-events/'
  },
  {
    title: 'Tech Innovation Summit 2024',
    description: 'Join industry leaders for a day of cutting-edge technology talks, networking, and innovation workshops.',
    date: getFutureDate(42),
    time: '09:00',
    venue: 'Sydney Convention Centre',
    city: 'Sydney',
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/technology-events/'
  },
  {
    title: 'Art Gallery Opening: Modern Australian Art',
    description: 'Celebrate the opening of our new exhibition featuring works from contemporary Australian artists.',
    date: getFutureDate(37),
    time: '18:00',
    venue: 'Art Gallery of New South Wales',
    city: 'Sydney',
    category: 'Arts',
    imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/arts-events/'
  },
  {
    title: 'Food & Wine Festival',
    description: 'Taste the best food and wine Sydney has to offer. Sample dishes from top restaurants and wineries.',
    date: getFutureDate(44),
    time: '12:00',
    venue: 'Darling Harbour',
    city: 'Sydney',
    category: 'Food & Drink',
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/food-drink-events/'
  },
  {
    title: 'Business Networking Breakfast',
    description: 'Connect with fellow entrepreneurs and business leaders over breakfast. Great networking opportunity!',
    date: getFutureDate(39),
    time: '07:30',
    venue: 'Harbour View Hotel',
    city: 'Sydney',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    sourceWebsite: 'Meetup',
    originalEventUrl: 'https://www.meetup.com/find/events/?location=australia--sydney&categoryId=2'
  },
  {
    title: 'Yoga in the Park',
    description: 'Start your weekend with a rejuvenating yoga session in the beautiful park. All levels welcome!',
    date: getFutureDate(36),
    time: '08:00',
    venue: 'Hyde Park',
    city: 'Sydney',
    category: 'Health & Wellness',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    sourceWebsite: 'Meetup',
    originalEventUrl: 'https://www.meetup.com/find/events/?location=australia--sydney&categoryId=32'
  },
  {
    title: 'Family Fun Day',
    description: 'A day of fun activities for the whole family! Games, food, music, and entertainment for all ages.',
    date: getFutureDate(43),
    time: '10:00',
    venue: 'Bondi Beach',
    city: 'Sydney',
    category: 'Family',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
    sourceWebsite: 'Eventbrite',
    originalEventUrl: 'https://www.eventbrite.com.au/d/australia--sydney/family-events/'
  }
];

async function addSampleEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete old sample events with fake URLs (optional - comment out if you want to keep them)
    console.log('Clearing old sample events with fake URLs (if any)...');
    await Event.deleteMany({
      $or: [
        { originalEventUrl: { $regex: /sample-/ } },
        { originalEventUrl: { $regex: /eventbrite.com.au\/e\/sample/ } },
        { originalEventUrl: { $regex: /meetup.com\/sample/ } }
      ]
    });

    console.log('Adding sample events with future dates...');
    
    for (const eventData of sampleEvents) {
      // Generate hashes
      const urlHash = Event.generateUrlHash(eventData.originalEventUrl);
      const duplicateHash = Event.generateDuplicateHash(
        eventData.title,
        eventData.date,
        eventData.venue
      );

      // Check for duplicates
      const existing = await Event.findOne({ urlHash });
      if (!existing) {
        const event = new Event({
          ...eventData,
          urlHash,
          duplicateCheckHash: duplicateHash
        });
        await event.save();
        console.log(`✅ Added: ${eventData.title} (${eventData.date.toLocaleDateString()})`);
      } else {
        console.log(`⏭️  Skipped (already exists): ${eventData.title}`);
      }
    }

    const finalCount = await Event.countDocuments();
    console.log(`\n✨ Successfully added ${finalCount} events to the database!`);
    console.log('Refresh your browser to see the events.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample events:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addSampleEvents();
