import { Router } from 'express';
import type { EntryService } from '../../services/entryService.js';
import { makeEntriesController } from '../controllers/entries.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function entriesRoutes(entryService: EntryService): Router {
  const router = Router();
  const controller = makeEntriesController(entryService);

  router.get('/entries', asyncHandler(controller.list));
  router.post('/entries', asyncHandler(controller.create));
  // Static path before ':id' so "rank" is never read as an id.
  router.put('/entries/rank', asyncHandler(controller.reorder));
  router.post('/entries/:id/fetch-price', asyncHandler(controller.fetchPrice));
  router.patch('/entries/:id', asyncHandler(controller.update));
  router.delete('/entries/:id', asyncHandler(controller.remove));
  router.get('/wishlist/total', asyncHandler(controller.wishlistTotal));

  return router;
}
