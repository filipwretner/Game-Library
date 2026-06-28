import type { Entry, EntryStatus, EntryWithGame, Game, GameMetadata } from '@game-tracker/shared';

/**
 * Repository ports (spec §7.1 layer 4). The ONLY abstraction services depend on
 * for data access — concrete Prisma impls live in repositories/prisma/ and are
 * injected at the composition root. Methods are intention-revealing and return
 * domain/shared types, never Prisma rows.
 */

export interface GamesRepo {
  /** Insert or update cached metadata, keyed by igdbId. Returns the stored game. */
  upsertByIgdbId(metadata: GameMetadata): Promise<Game>;
  findByIgdbId(igdbId: number): Promise<Game | null>;
}

/** Fields set when creating an entry. Status-specific fields are optional. */
export interface CreateEntryInput {
  gameId: number;
  status: EntryStatus;
  rank: number | null;
  ownedPlatform: Entry['ownedPlatform'];
  dateCompleted: string | null;
  notes: string | null;
}

/** Partial update; only provided fields change (spec §7.5 PATCH). */
export type UpdateEntryInput = Partial<Omit<Entry, 'id' | 'gameId' | 'createdAt'>>;

export interface EntriesRepo {
  findByStatus(status: EntryStatus): Promise<EntryWithGame[]>;
  findById(id: number): Promise<EntryWithGame | null>;
  findByGameId(gameId: number): Promise<Entry | null>;
  /** Highest rank currently used within a status, or null if none. */
  maxRank(status: EntryStatus): Promise<number | null>;
  create(input: CreateEntryInput): Promise<Entry>;
  update(id: number, patch: UpdateEntryInput): Promise<Entry>;
  delete(id: number): Promise<void>;
}
