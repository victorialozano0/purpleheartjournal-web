import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    song: z.string(),
    album: z.string(),
    excerpt: z.string(),
    quote: z.string().optional(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };
