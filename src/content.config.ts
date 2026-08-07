import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const STATES = ['learning', 'executing', 'reported'] as const;
export type State = (typeof STATES)[number];

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string(),

    // learning  = I want to understand this. No writeup. Exists to mark the gap.
    // executing = building it now. Beats 1-2 written, 3-4 come later.
    // reported  = done. All five beats.
    state: z.enum(STATES),

    // Groups the node when there are no embeddings yet, and tints nothing.
    // Clusters are structural, not decorative. See src/lib/clusters.ts.
    cluster: z.string(),

    // One line: what is this topic? Not what you found, which is the beats.
    // It's also most of what `npm run embed` has to work with on an entry you
    // haven't written up yet, so a vague summary means a vague map.
    summary: z.string().optional(),

    date: z.coerce.date().optional(),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),

    // Escape hatch. Always wins over embeddings. Use it when the map puts
    // something somewhere that reads wrong to you.
    position: z.tuple([z.number(), z.number()]).optional(),
  }),
});

export const collections = { entries };
