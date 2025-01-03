import axios, { AxiosResponse } from 'axios';
import { Core } from '@strapi/strapi';
import { DefaultConfig } from '../types/config/settings';
import { envConfig } from '../utils/env';
import { retryRequest } from '../utils/retry';
import { type GenerateArticleResponse, GenerateArticleResponseSchema } from '../types/api/content'
import type { PluginSettingsSchema, PluginSettingsSchemaFieldsSeo, PluginSettingsSchemaFieldsSeoMetaSocial } from '../types/config/plugin';

type SeoDataSocialMetaSocialNetwork = 'Facebook' | 'Twitter'

// Define SocialMeta type
type SeoDataSocialMeta = {
  socialNetwork: SeoDataSocialMetaSocialNetwork;
  title: string;
  description: string;
  imageUrl: string;
};

// Define SeoData type
type SeoData = {
  [key: string]: string | SeoDataSocialMeta[] | null;
};

// Define the possible value types for each key in articleData
type ArticleDataValue =
  | string
  | number
  | Date
  | {
      [key: string]: string | { url: string } | null;
      __component: string;
    }[]
  | SeoData
  | null;

// Define the overall structure for articleData
interface ArticleData {
  [key: string]: ArticleDataValue;
}

// Helper function to create SocialMeta array
const createSocialMeta = (metaSocialData: PluginSettingsSchemaFieldsSeoMetaSocial[]): SeoDataSocialMeta[] => (
  metaSocialData.map((el) => ({
    socialNetwork: el.socialNetwork as SeoDataSocialMetaSocialNetwork,
    title: el.title,
    description: el.description,
    imageUrl: el.imageUrl,
  }))
)

type CreateSeoDataArticleMeta = {
  title: string;
  description: string;
  imageUrl: string;
  keywords: string;
};

// Helper function to create SeoData
function createSeoData(fields: PluginSettingsSchemaFieldsSeo, articleMeta: CreateSeoDataArticleMeta): SeoData {
  const { metaTitle, metaDescription, metaImage, keywords } = fields;
  const seoData: SeoData = {
    [metaTitle]: articleMeta.title,
    [metaDescription]: articleMeta.description,
    [metaImage]: articleMeta.imageUrl,
    [keywords]: articleMeta.keywords,
  };
  return seoData;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Generates content via external prokodoCAT service and saves articles to Strapi.
   */
  async generateContent(): Promise<void> {
    try {
      // 1. Fetch and cache plugin settings using the settings service and plugin settings
      const pluginSettings: PluginSettingsSchema = strapi.config.get('plugin.prokodo-cat.schema');
      const fields = pluginSettings?.fields;

      if (!fields) {
        strapi.log.error('Fields configuration is missing in plugin settings.');
        throw new Error('Fields configuration is required.');
      }

      const categoryType = pluginSettings?.contentTypes?.category;
      const categoryField = fields?.category
      const categoryFieldDefined = typeof categoryField === 'string'

      const settingsService = strapi.plugin('prokodo-cat').service('settings');
      const config: DefaultConfig = await settingsService.getSettings();

      // Load all categories from users defined categories content-type
      let categories: {id: number, [key: string]: unknown}[] = []
      if (categoryType && categoryFieldDefined) {
        categories = await strapi.db.query(categoryType).findMany();
      }

      // 2. Construct payload for content generation API
      const payload = {
        domain: config.content_requirements.domain,
        plagiarize_max_retries: config.content_requirements.plagiarize_max_retries,
        textModel: config.content_requirements.textModel,
        contentLength: config.content_requirements.contentLength,
        contentLengthExact: config.content_requirements.contentLengthExact,
        categories: categoryField?.name && categories && categories.length > 0 ? categories.map(el => ({
          id: el.id,
          name: el[categoryField.name as string],
        })) : undefined
      };

      // 3. Validate environment variables
      // TODO: THIS SHOULD BE NOT IN ENV VARIABLES. SHOULD BE HARDCODED AS EXAMPLE IN CONFIG FOLDER
      const backendServiceUrl = envConfig.PROKODO_CAT_SERVICE_URL;
      if (!backendServiceUrl) {
        strapi.log.error('BACKEND_SERVICE_URL is not defined in environment variables.');
        throw new Error('Backend service URL not configured.');
      }

      // 4. Make API request to generate content
      const response: AxiosResponse<GenerateArticleResponse> = await retryRequest(
        () =>
          axios.post(
            `${backendServiceUrl}/generate`,
            payload,
            {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          ),
        3, // Number of retries
        2000 // Delay between retries in milliseconds
      );

      // 5. Validate API response
      const parseResponse = GenerateArticleResponseSchema.safeParse(response.data);

      if (!parseResponse.success) {
        strapi.log.error('Invalid response structure from content generation API:', parseResponse.error.flatten());
        throw new Error('Invalid response from content generation API.');
      }

      const { article } = parseResponse.data;

      if (!article) {
        strapi.log.warn('No article received from content generation API.');
        throw new Error('No article generated.');
      }

      // 5. Fetch default options from settings
      const articleType = pluginSettings?.contentTypes?.article;
      const dynamicZoneConfig = pluginSettings.dynamicZone;
      const defaultAuthors = config.content_requirements.defaultAuthors;
      const publishArticlesByDefault = config.content_requirements.publishArticlesByDefault;

      // Map blocks to the `ContentArea` structure
      const blocks = article.blocks.map((block) => ({
        __component: dynamicZoneConfig.blocks[0].component ?? 'sections.content-area',
        [dynamicZoneConfig.blocks[0].fields.title]: block.title,
        [dynamicZoneConfig.blocks[0].fields.subTitle]: block.subTitle || '',
        [dynamicZoneConfig.blocks[0].fields.content]: block.content,
        [dynamicZoneConfig.blocks[0].fields.image]: block.imageUrl
          ? {
              url: block.imageUrl,
            }
          : null,
      }));

      // 6. Prepare article data
      let articleData: ArticleData = {
        [fields.title]: article.title,
        [fields.slug]: article.slug, // Corrected assignment
        [fields.description]: article.description,
        [fields.cover]: article.imageUrl,
        [fields.blocks]: blocks,
        [fields.publishedAt]: publishArticlesByDefault ? new Date() : null,
      };

      // Add optional author and category content fields based on authorsWithCategories
      if (defaultAuthors && defaultAuthors.length > 0 && (typeof fields.category === 'string' || typeof fields.author === 'string')) {
        // Iterate through each author-category pair
        for (const pair of defaultAuthors) {
          const { categoryId } = pair;

          // Initialize variables to hold fetched data
          let author: {categoryId: number, authorId: number} | null = null;

          // Fetch the author using the user-defined author content type
          if (categoryId) {
            try {
              author = await strapi.db.query('plugin::prokodo-cat.settings.content-requirements-author-categories').findOne({
                where: { categoryId },
              });

              if (!author) {
                strapi.log.warn(`Author for categoryId ${categoryId} not found.`);
              }
            } catch (error) {
              strapi.log.error(`Error fetching author with categoryId ${categoryId}: ${error.message}`);
            }
          }

          // Assign the fetched category relation from external prokodoCAT
          if (article.category && typeof fields.category === 'string') {
            articleData = {
              ...articleData,
              [fields.category]: article.category,
            };
          }

          // Assign the fetched author to articleData if available and fields.author is defined
          if (author?.authorId && typeof fields.author === 'string') {
            articleData = {
              ...articleData,
              [fields.author]: author.authorId,
            };
          }
        }
      } else {
        strapi.log.warn('No authors and categories defined in content_requirements. Skipping author and category assignment.');
      }

      // Add optional SEO content fields
      if (fields.seo?.contentTypeName) {
        const seoContent = createSeoData(fields.seo, {
          title: article.meta.title,
          description: article.meta.description,
          imageUrl: article.meta.imageUrl,
          keywords: article.meta.keywords,
        });

        articleData = {
          ...articleData,
          [fields.seo.contentTypeName]: seoContent,
        };

        if (fields.seo.metaSocial?.contentTypeName && article.meta.metaSocial) {
          const socialMetaArray = createSocialMeta(article.meta.metaSocial as PluginSettingsSchemaFieldsSeoMetaSocial[]);

          // Ensure that the existing SEO content is of type SeoData before spreading
          const existingSeoContent = articleData[fields.seo.contentTypeName];
          if (isSeoData(existingSeoContent)) {
            articleData[fields.seo.contentTypeName] = {
              ...existingSeoContent,
              [fields.seo.metaSocial.contentTypeName]: socialMetaArray,
            };
          } else {
            strapi.log.error(`Expected SEO field '${fields.seo.contentTypeName}' to be of type SeoData.`);
            throw new Error(`Invalid SEO field type for '${fields.seo.contentTypeName}'.`);
          }
        }
      }

      // 7. Bulk create articles to optimize performance
      await strapi.db.query(articleType).create({
        data: articleData,
      });

      strapi.log.info(`Content fetched and saved article.`);
    } catch (error) {
      // Enhanced error handling
      if (axios.isAxiosError(error)) {
        strapi.log.error(`Axios error during content generation: ${error.message}`, {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        });
      } else {
        strapi.log.error(`Error in fetchAndSaveContent: ${error.message}`);
      }
      throw error; // Rethrow to allow higher-level handlers to manage it
    }
  },
});

// Type guard to check if a value is SeoData
function isSeoData(value: any): value is SeoData {
  if (value === null) return false;
  if (typeof value !== 'object') return false;
  // Additional checks can be added here if necessary
  return true;
}
