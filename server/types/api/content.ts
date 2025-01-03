import { z } from 'zod';

export const GenerateArticleResponseSchema = z.object({
    article: z.object({
      slug: z.string(),
      meta: z.object({
        title: z.string(),
        description: z.string(),
        imageUrl: z.string().url(),
        metaSocial: z.array(z.object({
          socialNetwork: z.enum(['Facebook', 'Twitter']),
          title: z.string(),
          description: z.string(),
          imageUrl: z.string().url(),
        })).optional(),
        keywords: z.string(),
      }),
      title: z.string(),
      description: z.string(),
      blocks: z.array(
        z.object({
          title: z.string(),
          subTitle: z.string().optional(),
          content: z.string(),
          imageUrl: z.string().url().optional(),
        })
      ),
      imageUrl: z.string().url(),
      category: z.number().optional(),
    }),
});

export type GenerateArticleResponse = z.infer<typeof GenerateArticleResponseSchema>;