import type { SearchService } from '../../services/searchService.js';
import { ValidationError } from '../../domain/errors.js';
import { searchQuerySchema } from '../validators/games.validators.js';
import type { AsyncRequestHandler } from '../middleware/asyncHandler.js';

export interface GamesController {
  searchGames: AsyncRequestHandler;
}

/**
 * Thin controller (spec §7.1): validate (Zod) → call one service method →
 * respond. No business logic, no IGDB, no Prisma.
 */
export function makeGamesController(searchService: SearchService): GamesController {
  return {
    searchGames: async (req, res) => {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid query');
      }
      const results = await searchService.searchGames(parsed.data.q);
      res.json(results);
    },
  };
}
