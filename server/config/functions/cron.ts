import type { Core } from '@strapi/strapi';
import NodeCache from 'node-cache';

import { DefaultConfig } from '../../types/config/settings';
import settingsService from '../../services/settings'
import newsletterService from '../../services/mailchimp/newsletter';
import { calculateScheduledTime } from '../../utils/schedule'; // Utility function to calculate schedule

const sentCache = new NodeCache({ stdTTL: 60 }); // 60 seconds TTL

// Define your cron jobs
export default {
  /**
   * This cron runs every minute and checks if it's time to send a newsletter.
   * It allows dynamic scheduling based on the current configuration.
   */
  '* * * * *': async ({ strapi }: { strapi: Core.Strapi }) => {
    try {
      const config: DefaultConfig = await settingsService({ strapi }).getSettings();
      const { timezone, newsletter_frequency, newsletter_day, newsletter_schedule } = config;
      strapi.log.info(`Checking if it's time to send the ${newsletter_frequency} newsletter.`);

      // Calculate the next scheduled time
      const now = new Date();
      const scheduledTime = calculateScheduledTime(
        newsletter_frequency,
        newsletter_schedule,
        newsletter_day,
        timezone,
        now
      );

      // Check if the current time matches the scheduled time (with a 1-minute window)
      const timeDifference = Math.abs(now.getTime() - scheduledTime.getTime());
      const oneMinute = 60 * 1000;

      const cacheKey = `newsletterSent_${scheduledTime.getTime()}`;
      if (timeDifference < oneMinute && !sentCache.get(cacheKey)) {
        await newsletterService({ strapi }).sendNewsletter();
        strapi.log.info(`${newsletter_frequency} newsletter sent successfully at ${now.toISOString()}.`);
        sentCache.set(cacheKey, true);
      }
    } catch (error) {
      strapi.log.error('Error in cron job for sending newsletter:', error);
    }
  },
};
