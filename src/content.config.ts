import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Editorial guides. `updated` changes only when the content really changes; `checked` = last fact check.
const pruvodce = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pruvodce' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lead: z.string(),
    order: z.number(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    checked: z.coerce.date(),
  }),
});

export const collections = { pruvodce };
