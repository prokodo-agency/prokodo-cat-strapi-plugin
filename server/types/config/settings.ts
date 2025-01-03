import { z } from 'zod';
import { TIME_FORMAT_REGEX } from '../../constants';
import { Frequency, Weekday } from './config.enums'; // Import enums

export const ContentRequirementsSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain must be at least 3 characters long')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  plagiarize_max_retries: z
    .number()
    .int()
    .min(1, 'plagiarize_max_retries must be at least 1')
    .max(10, 'plagiarize_max_retries cannot exceed 10')
    .default(3),
  textModel: z
    .enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'])
    .default('gpt-4o'),
  contentLength: z
    .number()
    .int()
    .min(1, 'contentLength must be at least 1')
    .max(2500, 'contentLength cannot exceed 2500')
    .default(1000),
  contentLengthExact: z.boolean().default(false),
  defaultAuthors: z
    .array(
      z.object({
        authorId: z.number().int(),
        categoryId: z.number().int().optional(),
      })
    )
    .optional(),
  publishArticlesByDefault: z.boolean().optional(),
});

export const DefaultConfigSchema = z.object({
  newsletter_frequency: z.nativeEnum(Frequency), // Use nativeEnum for enums
  newsletter_schedule: z
    .string()
    .regex(TIME_FORMAT_REGEX, 'Invalid time format. Expected HH:mm.')
    .optional()
    .default('07:00'),
  newsletter_day: z
    .nativeEnum(Weekday) // Use nativeEnum for enums
    .optional()
    .default(Weekday.Monday),
  timezone: z
    .string()
    .regex(
      /^(?:Etc\/UTC|(?:America|Europe|Asia|Australia|Africa|Pacific|Indian|Atlantic)\/[A-Za-z_]+)$/,
      'Invalid timezone format. Use IANA timezone strings like "America/New_York".'
    )
    .default('UTC'),
  mailchimp_server_prefix: z.string().min(1, 'Mailchimp Server Prefix is required'),
  mailchimp_list_id: z.string().min(1, 'Mailchimp List ID is required'),
  mailchimp_segment_id: z.string().optional(),
  mailchimp_template_id: z.string().min(1, 'Mailchimp Template ID is required'),
  content_requirements: ContentRequirementsSchema,
});

export type DefaultConfig = z.infer<typeof DefaultConfigSchema>;
