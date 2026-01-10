/**
 * Centralized Logging Utility
 * Provides structured logging throughout the application
 */

const { NODE_ENV, LOG_LEVEL } = require('../config/env');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.level = logLevels[LOG_LEVEL] || logLevels.info;
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data
    };

    if (NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    }
    
    // Pretty print for development
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${Object.keys(data).length ? ' ' + JSON.stringify(data, null, 2) : ''}`;
  }

  log(level, message, data) {
    if (logLevels[level] <= this.level) {
      console.log(this.formatMessage(level, message, data));
    }
  }

  error(message, error = {}) {
    this.log('error', message, {
      error: error.message || error,
      stack: error.stack
    });
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }
}

module.exports = new Logger();

