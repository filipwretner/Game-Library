import { z } from 'zod';

/** Zod schemas for the custom-list endpoints. Validated at the HTTP boundary. */

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title must not be empty'),
});

export const listIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEntryParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  entryId: z.coerce.number().int().positive(),
});

export const addListEntrySchema = z.object({
  igdbId: z.number().int().positive(),
});

export const listReorderSchema = z.object({
  orderedEntryIds: z.array(z.number().int().positive()).min(1),
});
