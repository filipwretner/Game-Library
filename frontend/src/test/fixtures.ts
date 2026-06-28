import { IGDB_PC } from '@game-tracker/shared';
import type { EntryWithGame } from '../types/index.ts';

/** Build an EntryWithGame for tests; override only the fields a test cares about. */
export function makeEntry(overrides: Partial<EntryWithGame> = {}): EntryWithGame {
  return {
    id: 7,
    gameId: 1,
    status: 'BACKLOG',
    rank: null,
    ownedPlatform: 'PC',
    price: null,
    normalPrice: null,
    discountPct: null,
    priceCurrency: null,
    priceStore: null,
    priceUpdatedAt: null,
    dateCompleted: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
    game: {
      id: 1,
      igdbId: 100,
      title: 'Hades',
      coverUrl: null,
      summary: null,
      releaseDate: null,
      platforms: [IGDB_PC],
      igdbRating: null,
      cachedAt: '2026-01-01T00:00:00.000Z',
      ...overrides.game,
    },
  };
}
