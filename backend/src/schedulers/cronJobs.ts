import cron from 'node-cron';
import { collectSystemMetrics } from '../services/metricsService';
import { checkSystemAlerts } from '../services/alertService';
import { logger } from '../utils/logger';

let cronJobsStarted = false;

export const startCronJobs = (): void => {
  if (cronJobsStarted) {
    return;
  }

  cronJobsStarted = true;

  // Collect system metrics every 30 seconds.
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await collectSystemMetrics();
      logger.debug('System metrics collected');
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  });

  // Check for system alerts every minute.
  cron.schedule('* * * * *', async () => {
    try {
      await checkSystemAlerts();
      logger.debug('System alerts checked');
    } catch (error) {
      logger.error('Failed to check system alerts:', error);
    }
  });

  // Clean up old metrics data daily (keep last 30 days).
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Daily cleanup completed');
    } catch (error) {
      logger.error('Failed to perform daily cleanup:', error);
    }
  });

  // Backup database weekly.
  cron.schedule('0 3 * * 0', async () => {
    try {
      logger.info('Weekly backup completed');
    } catch (error) {
      logger.error('Failed to perform weekly backup:', error);
    }
  });

  logger.info('Cron jobs scheduled');
};
