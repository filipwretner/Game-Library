import type { PrismaClient } from '@prisma/client';
import type { Game, GameMetadata } from '@game-tracker/shared';
import type { GamesRepo } from '../ports.js';
import { toGame } from './mappers.js';

/** Prisma-backed GamesRepo. The only place games are read/written. */
export class PrismaGamesRepo implements GamesRepo {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByIgdbId(metadata: GameMetadata): Promise<Game> {
    const data = {
      title: metadata.title,
      coverUrl: metadata.coverUrl,
      summary: metadata.summary,
      releaseDate: metadata.releaseDate ? new Date(metadata.releaseDate) : null,
      platforms: JSON.stringify(metadata.platforms),
      igdbRating: metadata.igdbRating,
      cachedAt: new Date(),
    };
    const row = await this.prisma.game.upsert({
      where: { igdbId: metadata.igdbId },
      create: { igdbId: metadata.igdbId, ...data },
      update: data,
    });
    return toGame(row);
  }

  async findByIgdbId(igdbId: number): Promise<Game | null> {
    const row = await this.prisma.game.findUnique({ where: { igdbId } });
    return row ? toGame(row) : null;
  }
}
