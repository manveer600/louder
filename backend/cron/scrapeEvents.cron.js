/**
 * Scraping Cron Job
 * Scheduled job for scraping events from all sources
 */

const scrapingOrchestrator = require('../services/scraping/orchestrator.service');
const logger = require('../utils/logger');

/**
 * Run scraping job
 * This can be called independently or via scheduler
 */
async function runScrapingJob() {
  try {
    logger.info('Cron job: Starting event scraping...');
    const result = await scrapingOrchestrator.scrapeAllSources();
    
    logger.info('Cron job: Scraping completed', {
      totalScraped: result.totalScraped,
      totalSaved: result.totalSaved,
      totalUpdated: result.totalUpdated,
      errors: result.errors.length
    });

    return result;
  } catch (error) {
    logger.error('Cron job: Scraping failed:', error);
    throw error;
  }
}

/**
 * Run cleanup job
 */
async function runCleanupJob() {
  try {
    logger.info('Cron job: Starting cleanup...');
    const deletedCount = await scrapingOrchestrator.cleanupOldEvents(30);
    logger.info(`Cron job: Cleanup completed. Deleted ${deletedCount} old events`);
    return deletedCount;
  } catch (error) {
    logger.error('Cron job: Cleanup failed:', error);
    throw error;
  }
}

// If run directly (e.g., via CLI or separate process)
if (require.main === module) {
  runScrapingJob()
    .then(() => {
      logger.info('Scraping job completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Scraping job failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runScrapingJob,
  runCleanupJob
};

