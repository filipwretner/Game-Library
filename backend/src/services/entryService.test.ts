import { beforeEach, describe, expect, it } from 'vitest';
import type { GameMetadata, PriceQuote } from '@game-tracker/shared';
import { buildTestHarness, type TestHarness } from '../test/fakes.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js';

const pcGame: GameMetadata = {
  igdbId: 1,
  title: 'Hades',
  coverUrl: null,
  summary: null,
  releaseDate: null,
  platforms: [6],
  igdbRating: null,
};
const ps5Game: GameMetadata = { ...pcGame, igdbId: 2, title: 'Bloodborne', platforms: [167] };

describe('EntryService', () => {
  let harness: TestHarness;

  beforeEach(() => {
    harness = buildTestHarness([pcGame, ps5Game]);
  });

  it('adds a backlog entry, caching the game and deriving the owned platform', async () => {
    const entry = await harness.container.entryService.addEntry({ igdbId: 1, status: 'BACKLOG' });

    expect(entry.status).toBe('BACKLOG');
    expect(entry.rank).toBeNull();
    expect(entry.ownedPlatform).toBe('PC');
    expect(entry.game.title).toBe('Hades');
  });

  it('derives PS5 when only PS5 is available', async () => {
    const entry = await harness.container.entryService.addEntry({ igdbId: 2, status: 'BACKLOG' });
    expect(entry.ownedPlatform).toBe('PS5');
  });

  it('assigns sequential ranks to PLAYED entries', async () => {
    const service = harness.container.entryService;
    const first = await service.addEntry({ igdbId: 1, status: 'PLAYED' });
    const second = await service.addEntry({ igdbId: 2, status: 'PLAYED' });

    expect(first.rank).toBe(1);
    expect(second.rank).toBe(2);
  });

  it('rejects adding a game that is already on a list', async () => {
    const service = harness.container.entryService;
    await service.addEntry({ igdbId: 1, status: 'BACKLOG' });

    await expect(service.addEntry({ igdbId: 1, status: 'WISHLIST' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('rejects an unknown IGDB id', async () => {
    await expect(
      harness.container.entryService.addEntry({ igdbId: 999, status: 'BACKLOG' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('clears price fields and assigns a rank when moving to PLAYED', async () => {
    const service = harness.container.entryService;
    const wishlist = await service.addEntry({ igdbId: 1, status: 'WISHLIST' });
    await service.updateEntry(wishlist.id, { price: 19.99, priceStore: 'Steam' });

    const moved = await service.updateEntry(wishlist.id, { status: 'PLAYED' });

    expect(moved.status).toBe('PLAYED');
    expect(moved.rank).toBe(1);
    expect(moved.price).toBeNull();
    expect(moved.priceStore).toBeNull();
  });

  it('reorders the Played list into a gap-free ranking', async () => {
    const service = harness.container.entryService;
    const a = await service.addEntry({ igdbId: 1, status: 'PLAYED' });
    const b = await service.addEntry({ igdbId: 2, status: 'PLAYED' });

    const reordered = await service.reorderPlayed([b.id, a.id]);

    expect(reordered.map((e) => [e.id, e.rank])).toEqual([
      [b.id, 1],
      [a.id, 2],
    ]);
  });

  it('rejects a reorder whose ids are not the current Played set', async () => {
    const service = harness.container.entryService;
    const a = await service.addEntry({ igdbId: 1, status: 'PLAYED' });

    await expect(service.reorderPlayed([a.id, 999])).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a reorder containing duplicate ids', async () => {
    const service = harness.container.entryService;
    const a = await service.addEntry({ igdbId: 1, status: 'PLAYED' });
    await service.addEntry({ igdbId: 2, status: 'PLAYED' });

    await expect(service.reorderPlayed([a.id, a.id])).rejects.toBeInstanceOf(ValidationError);
  });

  it('fetches a PC wishlist price and stores the quote', async () => {
    const quote: PriceQuote = {
      price: 6.24,
      normalPrice: 24.99,
      discountPct: 75,
      currency: 'USD',
      store: 'Steam',
      dealUrl: 'https://www.cheapshark.com/redirect?dealID=xyz',
    };
    const priced = buildTestHarness([pcGame], quote).container.entryService;
    const entry = await priced.addEntry({ igdbId: 1, status: 'WISHLIST' });

    const updated = await priced.fetchPrice(entry.id);

    expect(updated.price).toBe(6.24);
    expect(updated.normalPrice).toBe(24.99);
    expect(updated.discountPct).toBe(75);
    expect(updated.priceStore).toBe('Steam');
    expect(updated.priceUpdatedAt).not.toBeNull();
  });

  it('rejects auto price fetch for a PS5 wishlist item', async () => {
    const service = harness.container.entryService;
    const entry = await service.addEntry({ igdbId: 2, status: 'WISHLIST' });

    await expect(service.fetchPrice(entry.id)).rejects.toBeInstanceOf(ValidationError);
  });

  it('sums the wishlist total in USD', async () => {
    const priced = buildTestHarness([pcGame, ps5Game]).container.entryService;
    const a = await priced.addEntry({ igdbId: 1, status: 'WISHLIST' });
    const b = await priced.addEntry({ igdbId: 2, status: 'WISHLIST' });
    await priced.updateEntry(a.id, { price: 19.99 });
    await priced.updateEntry(b.id, { price: 10 });

    expect(await priced.wishlistTotal()).toEqual({ total: 29.99, currency: 'USD' });
  });

  it('deletes an entry and rejects deleting a missing one', async () => {
    const service = harness.container.entryService;
    const entry = await service.addEntry({ igdbId: 1, status: 'BACKLOG' });

    await service.deleteEntry(entry.id);
    expect(await service.listByStatus('BACKLOG')).toHaveLength(0);
    await expect(service.deleteEntry(entry.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
