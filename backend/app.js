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
const corsOptions = {
  origin: FRONTEND_URL || '*',
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

