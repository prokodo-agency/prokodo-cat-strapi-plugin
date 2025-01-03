import axios, { AxiosResponse } from 'axios';
import { Core } from '@strapi/strapi';
import { z } from 'zod';
import { retryRequest } from '../../utils/retry';
import { ALLOWED_NEWSLETTER_DAYS } from '../../constants';
import { DefaultConfig } from '../../types/config/settings';
import { Frequency, Weekday } from '../../types/config/config.enums';
import { envConfig } from '../../utils/env';
import { calculateScheduledTime } from '../../utils/schedule';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Fetches newsletter settings, retrieves articles, constructs newsletter content,
   * and sends the newsletter via Mailchimp.
   */
  async sendNewsletter(): Promise<void> {
    try {
      // 1. Fetch and cache plugin settings using the settings service
      const settingsService = strapi.plugin('prokodo-cat').service('settings');
      const config: DefaultConfig = await settingsService.getSettings();

      // 2. Destructure necessary config fields
      const {
        timezone,
        newsletter_frequency,
        newsletter_day,
        newsletter_schedule,
        mailchimp_server_prefix,
        mailchimp_list_id,
        mailchimp_segment_id,
        mailchimp_template_id,
      } = config;

      // Validate frequency field
      if (!Object.values(Frequency).includes(newsletter_frequency as Frequency)) {
        throw new Error(`Invalid frequency: ${newsletter_frequency}`);
      }

      let dateFilter: { $gte: Date; $lte: Date };
      const now = new Date();

      if (newsletter_frequency === Frequency.Daily) {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter = { $gte: startOfDay, $lte: now };
      } else if (newsletter_frequency === Frequency.Weekly) {
        if (!newsletter_day) {
          throw new Error('newsletter_day is required for weekly frequency.');
        }
        const startOfWeek = this.getStartOfWeek(newsletter_day as Weekday, now);
        dateFilter = { $gte: startOfWeek, $lte: now };
      } else {
        throw new Error(`Unsupported frequency: ${newsletter_frequency}`);
      }

      // 3. Fetch articles based on the date filter
      const articles = await strapi.entityService.findMany('plugin::prokodo-cat.content', {
        filters: {
          published_at: {
            $gte: dateFilter.$gte.toISOString(),
            $lte: dateFilter.$lte.toISOString(),
          },
        },
      });

      if (!articles || articles.length === 0) {
        strapi.log.info(`No articles to include in the ${newsletter_frequency} newsletter.`);
        return;
      }

      // 4. Construct newsletter content
      const newsletterContent = articles
        .map(article => `
          <h2>${article.title}</h2>
          <img src="${article.image.url}" alt="${article.title}" style="max-width:100%;" />
          <p>${article.description}</p>
          <p><small>Published on: ${new Date(article.published_at).toLocaleDateString()}</small></p>
        `)
        .join('<hr>');

      // 5. Create Mailchimp campaign
      const campaignResponse: AxiosResponse = await retryRequest(
        () =>
          axios.post(
            `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns`,
            {
              type: 'regular',
              recipients: {
                list_id: mailchimp_list_id,
                ...(mailchimp_segment_id && { segment_opts: { saved_segment_id: mailchimp_segment_id } }),
              },
              settings: {
                subject_line: `${capitalizeFirstLetter(newsletter_frequency)} Newsletter`,
                title: `${capitalizeFirstLetter(newsletter_frequency)} Newsletter Campaign`,
                from_name: 'Your Company',
                reply_to: 'noreply@yourcompany.com',
                template_id: mailchimp_template_id, // Use the specified template ID
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${envConfig.PROKODO_CAT_MAILCHIMP_API_KEY}`,
              },
              timeout: 10000, // 10 seconds timeout
            }
          ),
        3, // Number of retries
        2000 // Delay between retries in milliseconds
      );

      // 6. Parse and validate campaign ID
      const campaignId = z.string().parse(campaignResponse.data.id);

      // 7. Set campaign content using the template
      await retryRequest(
        () =>
          axios.put(
            `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
            {
              template: {
                id: mailchimp_template_id,
                sections: {
                  // Assuming the template has a placeholder named 'main_content'
                  main_content: newsletterContent,
                },
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${envConfig.PROKODO_CAT_MAILCHIMP_API_KEY}`,
              },
              timeout: 10000,
            }
          ),
        3,
        2000
      );

      // 8. Schedule the campaign
      const scheduledTime = calculateScheduledTime(newsletter_frequency, newsletter_schedule, newsletter_day, timezone, now);
      await retryRequest(
        () =>
          axios.post(
            `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/schedule`,
            {
              schedule_time: scheduledTime.toISOString(),
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${envConfig.PROKODO_CAT_MAILCHIMP_API_KEY}`,
              },
              timeout: 10000,
            }
          ),
        3,
        2000
      );

      strapi.log.info(`${capitalizeFirstLetter(newsletter_frequency)} newsletter scheduled successfully for ${scheduledTime.toISOString()}.`);
    } catch (error) {
      // Enhanced error handling
      if (axios.isAxiosError(error)) {
        strapi.log.error(`Axios error during newsletter sending: ${error.message}`, {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        });
      } else {
        strapi.log.error(`Error in sendNewsletter: ${error.message}`);
      }
      throw error; // Rethrow to allow higher-level handlers to manage it
    }
  },

  /**
   * Calculates the start of the week based on the specified weekday.
   * @param weekday - The weekday to consider as the start.
   * @param referenceDate - The reference date to calculate from.
   * @returns The Date object representing the start of the week.
   */
  getStartOfWeek(weekday: Weekday, referenceDate: Date): Date {
    const date = new Date(referenceDate);
    const dayIndex = ALLOWED_NEWSLETTER_DAYS.indexOf(weekday);
    const currentDay = date.getDay(); // Sunday - Saturday : 0 - 6
    const distance = (currentDay + 7 - dayIndex) % 7;
    date.setDate(date.getDate() - distance);
    date.setHours(0, 0, 0, 0);
    return date;
  },
});

/**
 * Capitalizes the first letter of a string.
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}