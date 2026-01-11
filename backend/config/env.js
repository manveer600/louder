/**
 * Environment Configuration
 * Centralized environment variables management
 */

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  API_VERSION: process.env.API_VERSION || 'v1',
  SCRAPING_INTERVAL_HOURS: process.env.SCRAPING_INTERVAL_HOURS || 6,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Email configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@louder.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Louder'
};

