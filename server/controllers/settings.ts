import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handles GET requests to retrieve plugin settings configuration.
   * Endpoint: GET /settings
   */
  async getSettings(ctx) {
    try {
      // Access the settings service
      const settingsService = strapi.plugin('prokodo-cat').service('settings');
      
      // Retrieve the configuration
      const config = await settingsService.getSettings();

      // Respond with the configuration data
      ctx.send({ data: config });
    } catch (error) {
      // Log the error for debugging purposes
      strapi.log.error('Failed to retrieve plugin settings:', error);

      // Respond with an error message and status code
      ctx.throw(500, 'Failed to retrieve plugin settings.');
    }
  },

  /**
   * Handles PUT requests to update plugin settings configuration.
   * Endpoint: PUT /settings
   */
  async updateSettings(ctx) {
    try {
      const settingsService = strapi.plugin('prokodo-cat').service('settings');
      const { body } = ctx.request;

      // Update the configuration
      const updatedConfig = await settingsService.updateSettings(body);

      // Respond with the updated configuration data
      ctx.send({ message: 'Settings updated successfully.', data: updatedConfig });
    } catch (error) {
      // Log the error for debugging purposes
      strapi.log.error('Failed to update plugin settings:', error);

      // Respond with an error message and status code
      ctx.throw(500, 'Failed to update plugin settings.');
    }
  },
});