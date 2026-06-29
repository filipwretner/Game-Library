import type { Game } from '@game-tracker/shared';
import type { GamesRepo } from '../repositories/ports.js';
import type { MetadataProvider } from '../integrations/ports.js';
import { NotFoundError } from '../domain/errors.js';

/**
 * Resolves a game by IGDB id to a cached `Game` row, fetching + caching metadata
 * on first reference. The single home for this logic — reused by every service
 * that adds a game (core entries and custom lists).
 */
export class GameCatalog {
  constructor(
    private readonly games: GamesRepo,
    private readonly metadata: MetadataProvider,
  ) {}

  async resolveByIgdbId(igdbId: number): Promise<Game> {
    const cached = await this.games.findByIgdbId(igdbId);
    if (cached) return cached;

    const metadata = await this.metadata.getByIgdbId(igdbId);
    if (!metadata) {
      throw new NotFoundError(`No IGDB game found for id ${igdbId}`);
    }
    return this.games.upsertByIgdbId(metadata);
  }
}
