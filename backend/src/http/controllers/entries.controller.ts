import type { z } from 'zod';
import type { EntryService } from '../../services/entryService.js';
import type { AsyncRequestHandler } from '../middleware/asyncHandler.js';
import { ValidationError } from '../../domain/errors.js';
import {
  createEntrySchema,
  entryIdParamSchema,
  listEntriesQuerySchema,
  reorderSchema,
  updateEntrySchema,
} from '../validators/entries.validators.js';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

export interface EntriesController {
  list: AsyncRequestHandler;
  create: AsyncRequestHandler;
  update: AsyncRequestHandler;
  remove: AsyncRequestHandler;
  reorder: AsyncRequestHandler;
  fetchPrice: AsyncRequestHandler;
  wishlistTotal: AsyncRequestHandler;
}

/** Thin controllers (spec §7.1): validate → call one service method → respond. */
export function makeEntriesController(entryService: EntryService): EntriesController {
  return {
    list: async (req, res) => {
      const { status } = parse(listEntriesQuerySchema, req.query);
      res.json(await entryService.listByStatus(status));
    },
    create: async (req, res) => {
      const body = parse(createEntrySchema, req.body);
      res.status(HTTP_CREATED).json(await entryService.addEntry(body));
    },
    update: async (req, res) => {
      const { id } = parse(entryIdParamSchema, req.params);
      const patch = parse(updateEntrySchema, req.body);
      res.json(await entryService.updateEntry(id, patch));
    },
    remove: async (req, res) => {
      const { id } = parse(entryIdParamSchema, req.params);
      await entryService.deleteEntry(id);
      res.status(HTTP_NO_CONTENT).end();
    },
    reorder: async (req, res) => {
      const { orderedEntryIds } = parse(reorderSchema, req.body);
      res.json(await entryService.reorderPlayed(orderedEntryIds));
    },
    fetchPrice: async (req, res) => {
      const { id } = parse(entryIdParamSchema, req.params);
      res.json(await entryService.fetchPrice(id));
    },
    wishlistTotal: async (_req, res) => {
      res.json(await entryService.wishlistTotal());
    },
  };
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid request');
  }
  return result.data;
}
