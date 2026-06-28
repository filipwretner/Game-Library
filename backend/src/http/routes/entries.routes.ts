import { Router } from 'express';
import type { EntryService } from '../../services/entryService.js';
import { makeEntriesController } from '../controllers/entries.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function entriesRoutes(entryService: EntryService): Router {
  const router = Router();
  const controller = makeEntriesController(entryService);

  router.get('/entries', asyncHandler(controller.list));
  router.post('/entries', asyncHandler(controller.create));
  router.patch('/entries/:id', asyncHandler(controller.update));
  router.delete('/entries/:id', asyncHandler(controller.remove));

  return router;
}
