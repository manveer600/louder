/**
 * MongoDB Database Connection
 * Handles connection to MongoDB Atlas
 */

const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!MONGODB_URI || MONGODB_URI.trim() === '') {
      logger.error('MONGODB_URI is not set in environment variables');
      throw new Error('MongoDB connection string is missing');
    }

    // Set connection options with timeout
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    logger.info('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`, {
      environment: NODE_ENV,
      database: conn.connection.name,
      readyState: conn.connection.readyState
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Don't exit in production - let the app handle it
    if (NODE_ENV === 'development') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;

