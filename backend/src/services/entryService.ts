import { preferredPlatform } from '@game-tracker/shared';
import type { EntryStatus, EntryWithGame, Game } from '@game-tracker/shared';
import type { EntriesRepo, GamesRepo, UpdateEntryInput } from '../repositories/ports.js';
import type { MetadataProvider } from '../integrations/ports.js';
import { ConflictError, NotFoundError } from '../domain/errors.js';
import { resetFieldsForStatus } from '../domain/entryRules.js';

/** Body for adding a game to a list (spec §7.5 POST /api/entries). */
export interface AddEntryInput {
  igdbId: number;
  status: EntryStatus;
  ownedPlatform?: 'PC' | 'PS5' | null;
  dateCompleted?: string | null;
  notes?: string | null;
}

const FIRST_RANK = 1;

/**
 * Entry use cases (spec §7.1 layer 2). Coordinates repositories, the metadata
 * provider, and pure domain rules. Depends only on ports.
 */
export class EntryService {
  constructor(
    private readonly entries: EntriesRepo,
    private readonly games: GamesRepo,
    private readonly metadata: MetadataProvider,
  ) {}

  listByStatus(status: EntryStatus): Promise<EntryWithGame[]> {
    return this.entries.findByStatus(status);
  }

  async addEntry(input: AddEntryInput): Promise<EntryWithGame> {
    const game = await this.resolveGame(input.igdbId);

    const existing = await this.entries.findByGameId(game.id);
    if (existing) {
      throw new ConflictError('Game is already on a list');
    }

    const created = await this.entries.create({
      gameId: game.id,
      status: input.status,
      rank: await this.nextRankFor(input.status),
      ownedPlatform: this.resolveOwnedPlatform(input, game),
      dateCompleted: input.dateCompleted ?? null,
      notes: input.notes ?? null,
    });
    return this.requireById(created.id);
  }

  async updateEntry(id: number, patch: UpdateEntryInput): Promise<EntryWithGame> {
    const current = await this.requireById(id);
    const effective = await this.applyStatusTransition(current, patch);
    await this.entries.update(id, effective);
    return this.requireById(id);
  }

  async deleteEntry(id: number): Promise<void> {
    await this.requireById(id);
    await this.entries.delete(id);
  }

  /** When status changes, clear the old list's fields and assign a PLAYED rank. */
  private async applyStatusTransition(
    current: EntryWithGame,
    patch: UpdateEntryInput,
  ): Promise<UpdateEntryInput> {
    if (!patch.status || patch.status === current.status) {
      return patch;
    }
    const moved: UpdateEntryInput = { ...resetFieldsForStatus(patch.status), ...patch };
    if (patch.status === 'PLAYED') {
      moved.rank = await this.nextRankFor('PLAYED');
    }
    return moved;
  }

  private async resolveGame(igdbId: number): Promise<Game> {
    const cached = await this.games.findByIgdbId(igdbId);
    if (cached) return cached;

    const metadata = await this.metadata.getByIgdbId(igdbId);
    if (!metadata) {
      throw new NotFoundError(`No IGDB game found for id ${igdbId}`);
    }
    return this.games.upsertByIgdbId(metadata);
  }

  private resolveOwnedPlatform(input: AddEntryInput, game: Game): 'PC' | 'PS5' | null {
    if (input.status === 'WISHLIST') return null;
    return input.ownedPlatform ?? preferredPlatform(game.platforms);
  }

  private async nextRankFor(status: EntryStatus): Promise<number | null> {
    if (status !== 'PLAYED') return null;
    const max = await this.entries.maxRank('PLAYED');
    return max === null ? FIRST_RANK : max + 1;
  }

  private async requireById(id: number): Promise<EntryWithGame> {
    const entry = await this.entries.findById(id);
    if (!entry) {
      throw new NotFoundError(`Entry ${id} not found`);
    }
    return entry;
  }
}
