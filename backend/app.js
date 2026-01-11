/**
 * Express Application Configuration
 * Main application setup with middleware and routes
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { NODE_ENV, FRONTEND_URL, API_VERSION } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Import routes
const eventRoutes = require('./routes/event.routes');
const userRoutes = require('./routes/user.routes');

// Initialize Express app
const app = express();

// CORS configuration
// Allow multiple origins for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'https://louder-frontend-sigma.vercel.app',
  FRONTEND_URL
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // In production, log but allow for now (you can make this stricter)
      logger.warn(`CORS: Blocked origin ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Allow for now, change to callback(new Error('Not allowed')) to block
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API routes with versioning
const apiBase = `/api/${API_VERSION}`;
app.use(`${apiBase}/events`, eventRoutes);
app.use(`${apiBase}/users`, userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Louder API - Live Events & Ticketing Platform',
    version: API_VERSION,
    endpoints: {
      events: `${apiBase}/events`,
      users: `${apiBase}/users`,
      health: '/health'
    }
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Export app for testing
module.exports = app;

