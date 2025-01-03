import { z } from 'zod';

const EnvSchema = z.object({
  PROKODO_CAT_SERVICE_URL: z.string().url(),
  PROKODO_CAT_API_KEY: z.string().url(),
  PROKODO_CAT_MAILCHIMP_API_KEY: z.string(),
  // Add other required environment variables here
});

const env = EnvSchema.safeParse(process.env);

if (!env.success) {
  throw new Error(`Environment variables validation failed: ${env.error.flatten().fieldErrors}`);
}

export const envConfig = env.data;