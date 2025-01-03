// src/plugins/prokodo-cat/services/settings.ts

import { Core } from '@strapi/strapi';
import NodeCache from 'node-cache';
import { DefaultConfigSchema, DefaultConfig } from '../types/config/settings'; // Adjust the import path as necessary

// Initialize cache with a Time-To-Live (TTL) of 10 minutes (600 seconds)
const settingsCache = new NodeCache({ stdTTL: 600 });

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Retrieves and caches the plugin configuration.
   * @returns The validated configuration object.
   */
  async getSettings(): Promise<DefaultConfig> {
    // Attempt to retrieve settings from cache
    let config = settingsCache.get<DefaultConfig>('config');

    if (!config) {
      // Fetch settings from the single entry (singleton)
      const setting = await strapi.db.query('plugin::prokodo-cat.settings').findOne({
        populate: ['content_requirements'], // Populate the component
      });

      if (!setting) {
        strapi.log.error('Plugin settings are not configured.');
        throw new Error('Plugin settings are not configured.');
      }

      // Validate and parse settings using Zod schema
      const parsedConfig = DefaultConfigSchema.safeParse(setting);

      if (!parsedConfig.success) {
        const formattedErrors = parsedConfig.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        strapi.log.error(`Invalid plugin settings: ${formattedErrors}`);
        throw new Error('Invalid plugin settings configuration.');
      }

      config = parsedConfig.data;

      // Store the validated config in cache
      settingsCache.set('config', config);
    }

    return config;
  },

  /**
   * Updates the plugin configuration settings.
   * @param data - The new settings data.
   * @returns The updated configuration object.
   */
  async updateSettings(data: Partial<DefaultConfig>): Promise<DefaultConfig> {
    try {
      // Validate and parse the updated settings
      const parsedData = DefaultConfigSchema.safeParse(data);

      if (!parsedData.success) {
        const formattedErrors = parsedData.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        strapi.log.error(`Invalid plugin settings after update: ${formattedErrors}`);
        throw new Error('Invalid plugin settings configuration after update.');
      }

      const config = parsedData.data;

      // Update the singleton settings entry
      await strapi.db.query('plugin::prokodo-cat.settings').update({
        where: { id: 'settings' }, // Ensure this matches your singleton ID
        data: config,
      });

      // Update the cache with the new configuration
      settingsCache.set('config', config);

      return config;
    } catch (error) {
      strapi.log.error('Failed to update plugin settings:', error);
      throw new Error('Failed to update plugin settings.');
    }
  },
});
