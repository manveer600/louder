/**
 * MongoDB Database Connection
 * Handles connection to MongoDB Atlas
 * Optimized for serverless environments (Vercel)
 */

const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');
const logger = require('../utils/logger');

// Cache the connection to reuse in serverless environments
let cachedConnection = null;

const connectDB = async () => {
  try {
    // If connection exists and is ready, return it (for serverless)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      logger.info('Using cached MongoDB connection');
      return cachedConnection;
    }

    // Check if MONGODB_URI is provided
    if (!MONGODB_URI || MONGODB_URI.trim() === '') {
      logger.error('MONGODB_URI is not set in environment variables');
      throw new Error('MongoDB connection string is missing');
    }

    // Set connection options with timeout
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+
    // bufferMaxEntries and bufferCommands are also deprecated
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
    };

    logger.info('Attempting to connect to MongoDB...');
    
    // Connect and wait for connection to be fully ready
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    // Wait for connection to be fully established
    // mongoose.connect() may return before connection is ready in serverless
    if (mongoose.connection.readyState !== 1) {
      logger.info('Waiting for connection to be fully ready...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout: mongoose.connect() returned but connection not ready'));
        }, 10000);
        
        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });
    }
    
    // Cache the connection
    cachedConnection = conn;

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`, {
      environment: NODE_ENV,
      database: conn.connection.name,
      readyState: conn.connection.readyState
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
      cachedConnection = null; // Clear cache on error
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
      cachedConnection = null; // Clear cache on disconnect
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
      cachedConnection = mongoose.connection; // Update cache
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      cachedConnection = null;
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
    
    cachedConnection = null; // Clear cache on error
    
    // Don't exit in production - let the app handle it
    if (NODE_ENV === 'development') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Ensure MongoDB connection is ready before running queries
 * Use this in controllers to wait for connection
 * Optimized for serverless environments (Vercel)
 */
const ensureConnection = async () => {
  // ReadyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const readyState = mongoose.connection.readyState;
  
  logger.info(`[ensureConnection] Current readyState: ${readyState}`);
  
  if (readyState === 1) {
    logger.info('[ensureConnection] Already connected');
    return true; // Already connected
  }

  if (readyState === 2) {
    // Connecting - wait for it (max 15 seconds for serverless)
    logger.info('[ensureConnection] Connection in progress, waiting...');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout: waited 15 seconds for connection'));
      }, 15000);
      
      const connectedHandler = () => {
        clearTimeout(timeout);
        mongoose.connection.removeListener('error', errorHandler);
        logger.info('[ensureConnection] Connection established via event');
        resolve(true);
      };
      
      const errorHandler = (err) => {
        clearTimeout(timeout);
        mongoose.connection.removeListener('connected', connectedHandler);
        logger.error('[ensureConnection] Connection error:', err);
        reject(err);
      };
      
      mongoose.connection.once('connected', connectedHandler);
      mongoose.connection.once('error', errorHandler);
      
      // Also check periodically in case event doesn't fire
      const checkInterval = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          mongoose.connection.removeListener('connected', connectedHandler);
          mongoose.connection.removeListener('error', errorHandler);
          logger.info('[ensureConnection] Connection established via polling');
          resolve(true);
        }
      }, 100);
    });
  }

  // Not connected (0 or 3) - connect now
  logger.info('[ensureConnection] Not connected, establishing connection...');
  try {
    await connectDB();
    
    // Wait for connection to be fully ready (polling approach for reliability)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max (50 * 100ms)
    
    while (mongoose.connection.readyState !== 1 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Connection not ready after ${attempts * 100}ms. ReadyState: ${mongoose.connection.readyState}, expected 1`);
    }
    
    logger.info(`[ensureConnection] Connection established successfully after ${attempts * 100}ms`);
    return true;
  } catch (error) {
    logger.error('[ensureConnection] Failed to establish connection:', error);
    throw error;
  }
};

module.exports = { connectDB, ensureConnection };

