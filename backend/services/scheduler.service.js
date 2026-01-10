/**
 * Scheduler Service
 * Handles scheduled scraping jobs using node-cron
 */

const cron = require('node-cron');
const scrapingOrchestrator = require('./scraping/orchestrator.service');
const logger = require('../utils/logger');
const { SCRAPING_INTERVAL_HOURS } = require('../config/env');

class SchedulerService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start scheduled scraping job
   * Default: Every 6 hours (configurable via env)
   */
  startScrapingJob() {
    if (this.isRunning) {
      logger.warn('Scraping job already running');
      return;
    }

    // Convert hours to cron expression
    // If interval is 6 hours: '0 */6 * * *' (every 6 hours)
    // If interval is 12 hours: '0 */12 * * *' (every 12 hours)
    const hours = parseInt(SCRAPING_INTERVAL_HOURS) || 6;
    const cronExpression = `0 */${hours} * * *`; // Every N hours at minute 0

    logger.info(`Starting scheduled scraping job. Interval: ${hours} hours (${cronExpression})`);

    const job = cron.schedule(cronExpression, async () => {
      logger.info('Scheduled scraping job triggered');
      try {
        await scrapingOrchestrator.scrapeAllSources();
        logger.info('Scheduled scraping job completed successfully');
      } catch (error) {
        logger.error('Scheduled scraping job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Australia/Sydney'
    });

    this.jobs.push({ name: 'scraping', job });
    this.isRunning = true;

    // Run immediately on start (optional - comment out if not desired)
    logger.info('Running initial scrape on startup...');
    scrapingOrchestrator.scrapeAllSources().catch(error => {
      logger.error('Initial scrape failed:', error);
    });
  }

  /**
   * Start cleanup job (daily at 2 AM)
   */
  startCleanupJob() {
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Scheduled cleanup job triggered');
      try {
        await scrapingOrchestrator.cleanupOldEvents(30); // Remove events older than 30 days
        logger.info('Scheduled cleanup job completed successfully');
      } catch (error) {
        logger.error('Scheduled cleanup job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Australia/Sydney'
    });

    this.jobs.push({ name: 'cleanup', job: cleanupJob });
    logger.info('Cleanup job scheduled (daily at 2 AM Sydney time)');
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    this.startScrapingJob();
    this.startCleanupJob();
    logger.info('All scheduler jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Stopped scheduler job: ${name}`);
    });
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      jobs: this.jobs.map(({ name }) => name)
    };
  }
}

module.exports = new SchedulerService();

