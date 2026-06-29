import { Router } from 'express';
import type { CustomListService } from '../../services/customListService.js';
import { makeListsController } from '../controllers/lists.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function listsRoutes(service: CustomListService): Router {
  const router = Router();
  const controller = makeListsController(service);

  router.get('/lists', asyncHandler(controller.list));
  router.post('/lists', asyncHandler(controller.create));
  router.delete('/lists/:id', asyncHandler(controller.remove));
  router.get('/lists/:id/entries', asyncHandler(controller.entries));
  router.post('/lists/:id/entries', asyncHandler(controller.addEntry));
  router.put('/lists/:id/rank', asyncHandler(controller.reorder));
  router.delete('/lists/:id/entries/:entryId', asyncHandler(controller.removeEntry));

  return router;
}
