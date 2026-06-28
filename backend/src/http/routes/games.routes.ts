import { Router } from 'express';
import type { SearchService } from '../../services/searchService.js';
import { makeGamesController } from '../controllers/games.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function gamesRoutes(searchService: SearchService): Router {
  const router = Router();
  const controller = makeGamesController(searchService);
  router.get('/games/search', asyncHandler(controller.searchGames));
  return router;
}
