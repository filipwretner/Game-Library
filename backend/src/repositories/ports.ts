import type { Entry, EntryStatus, Game } from '@game-tracker/shared';

/**
 * Repository ports (spec §7.1 layer 4). The ONLY abstraction services depend on
 * for data access — concrete Prisma impls live in repositories/prisma/ and are
 * injected at the composition root. Methods are intention-revealing and return
 * domain types, never Prisma rows.
 *
 * Methods are added as milestones land (M3+). Kept minimal for the skeleton.
 */

export interface GamesRepo {
  upsertByIgdbId(game: Omit<Game, 'id'>): Promise<Game>;
  findByIgdbId(igdbId: number): Promise<Game | null>;
}

export interface EntriesRepo {
  findByStatus(status: EntryStatus): Promise<Entry[]>;
  findById(id: number): Promise<Entry | null>;
}
