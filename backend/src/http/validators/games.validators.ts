import { z } from 'zod';

/** Validates the search query string at the HTTP boundary (spec §7.4). */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Query must not be empty'),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
