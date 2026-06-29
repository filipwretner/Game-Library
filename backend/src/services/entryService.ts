import { preferredPlatform, wishlistTotal } from '@game-tracker/shared';
import type { EntryStatus, EntryWithGame, Game, Platform } from '@game-tracker/shared';
import type { EntriesRepo, GamesRepo, UpdateEntryInput } from '../repositories/ports.js';
import type { MetadataProvider, PriceProvider } from '../integrations/ports.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js';
import { resetFieldsForStatus } from '../domain/entryRules.js';
import { recomputeRanks } from '../domain/ranking.js';

export interface WishlistTotal {
  total: number;
  currency: string;
}

const PRICE_CURRENCY = 'USD';

/** Body for adding a game to a list (spec §7.5 POST /api/entries). */
export interface AddEntryInput {
  igdbId: number;
  status: EntryStatus;
  ownedPlatform?: Platform | null;
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
    private readonly prices: PriceProvider,
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

  /**
   * Commit a drag-and-drop reorder of one list (spec §7.5 PUT /api/entries/rank).
   * The given ids must be exactly the current set for that status, so a stale or
   * partial list can't corrupt the ranking. Returns the freshly ordered list.
   */
  async reorderEntries(status: EntryStatus, orderedEntryIds: number[]): Promise<EntryWithGame[]> {
    const current = await this.entries.findByStatus(status);
    if (
      !isSamePermutation(
        orderedEntryIds,
        current.map((e) => e.id),
      )
    ) {
      throw new ValidationError(`orderedEntryIds must match the current ${status} entries`);
    }
    await this.entries.setRanks(recomputeRanks(orderedEntryIds));
    return this.entries.findByStatus(status);
  }

  /**
   * Auto-fetch a PC wishlist item's price via the PriceProvider (spec §7.5).
   * PS5/non-PC items use manual entry (PATCH), so this rejects them with 400.
   */
  async fetchPrice(id: number): Promise<EntryWithGame> {
    const entry = await this.requireById(id);
    if (entry.status !== 'WISHLIST') {
      throw new ValidationError('Price fetch is only available for wishlist items');
    }
    if (preferredPlatform(entry.game.platforms) !== 'PC') {
      throw new ValidationError('Auto price fetch is PC-only; enter the PS5 price manually');
    }
    const quote = await this.prices.getBestPrice(entry.game.title);
    if (!quote) {
      throw new NotFoundError(`No PC deal found for ${entry.game.title}`);
    }
    await this.entries.update(id, {
      price: quote.price,
      normalPrice: quote.normalPrice,
      discountPct: quote.discountPct,
      priceCurrency: quote.currency,
      priceStore: quote.store,
      priceUpdatedAt: new Date().toISOString(),
    });
    return this.requireById(id);
  }

  async wishlistTotal(): Promise<WishlistTotal> {
    const entries = await this.entries.findByStatus('WISHLIST');
    return { total: wishlistTotal(entries.map((e) => e.price)), currency: PRICE_CURRENCY };
  }

  /** When status changes, clear the old list's fields and append to the new list's order. */
  private async applyStatusTransition(
    current: EntryWithGame,
    patch: UpdateEntryInput,
  ): Promise<UpdateEntryInput> {
    if (!patch.status || patch.status === current.status) {
      return patch;
    }
    return {
      ...resetFieldsForStatus(patch.status),
      ...patch,
      rank: await this.nextRankFor(patch.status),
    };
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

  private resolveOwnedPlatform(input: AddEntryInput, game: Game): Platform | null {
    if (input.status === 'WISHLIST') return null;
    return input.ownedPlatform ?? preferredPlatform(game.platforms);
  }

  /** Next rank to append within a list (every list is ordered now). */
  private async nextRankFor(status: EntryStatus): Promise<number> {
    const max = await this.entries.maxRank(status);
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

/** True when both arrays are the same multiset of ids — rejects duplicates and gaps. */
function isSamePermutation(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((id, i) => id === sortedB[i]);
}
