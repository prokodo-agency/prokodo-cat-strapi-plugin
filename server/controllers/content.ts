import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handles POST requests to generate new bog articles by external prokodoCAT service.
   * Endpoint: POST /content/generate
   */
  async generateContent(ctx) {
    try {
      const contentService = strapi.plugin('prokodo-cat').service('content');
      await contentService.generateContent();
      ctx.send({ message: 'Content generated successfully.' });
    } catch (error) {
      strapi.log.error(error.message);
      ctx.throw(500, 'Failed to fetch and save content.');
    }
  },
});
