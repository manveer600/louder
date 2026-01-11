const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');
const logger = require('./utils/logger');
const schedulerService = require('./services/scheduler.service');

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('Database connection established');
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // Start scheduled jobs (scraping, cleanup)
    logger.info('Initializing scheduler service...');
    schedulerService.startAll();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop scheduled jobs
      schedulerService.stopAll();
      
      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      gracefulShutdown('UnhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('UncaughtException');
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

