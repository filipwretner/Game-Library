import { z } from 'zod';

/** Zod schemas for the entries endpoints (spec §7.5). Validated at the HTTP boundary. */

const MAX_DISCOUNT_PCT = 100;

export const entryStatusSchema = z.enum(['PLAYED', 'BACKLOG', 'WISHLIST']);
const platformSchema = z.enum(['PC', 'PS5']);

export const listEntriesQuerySchema = z.object({
  status: entryStatusSchema,
});

export const entryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createEntrySchema = z.object({
  igdbId: z.number().int().positive(),
  status: entryStatusSchema,
  ownedPlatform: platformSchema.nullable().optional(),
  dateCompleted: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateEntrySchema = z
  .object({
    status: entryStatusSchema,
    rank: z.number().int().positive().nullable(),
    ownedPlatform: platformSchema.nullable(),
    price: z.number().nonnegative().nullable(),
    normalPrice: z.number().nonnegative().nullable(),
    discountPct: z.number().int().min(0).max(MAX_DISCOUNT_PCT).nullable(),
    priceCurrency: z.string().nullable(),
    priceStore: z.string().nullable(),
    dateCompleted: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .partial();

export const reorderSchema = z.object({
  orderedEntryIds: z.array(z.number().int().positive()).min(1),
});

export type CreateEntryBody = z.infer<typeof createEntrySchema>;
export type UpdateEntryBody = z.infer<typeof updateEntrySchema>;
