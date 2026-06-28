import type { Entry as PrismaEntry, Game as PrismaGame } from '@prisma/client';
import type { Entry, EntryStatus, EntryWithGame, Game, Platform } from '@game-tracker/shared';

/** Translate Prisma rows into shared domain types. Dates → ISO strings, platforms JSON → number[]. */

function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export function toGame(row: PrismaGame): Game {
  return {
    id: row.id,
    igdbId: row.igdbId,
    title: row.title,
    coverUrl: row.coverUrl,
    summary: row.summary,
    releaseDate: toIso(row.releaseDate),
    platforms: parsePlatforms(row.platforms),
    igdbRating: row.igdbRating,
    cachedAt: row.cachedAt.toISOString(),
  };
}

export function toEntry(row: PrismaEntry): Entry {
  return {
    id: row.id,
    gameId: row.gameId,
    status: row.status as EntryStatus,
    rank: row.rank,
    ownedPlatform: row.ownedPlatform as Platform | null,
    price: row.price,
    normalPrice: row.normalPrice,
    discountPct: row.discountPct,
    priceCurrency: row.priceCurrency,
    priceStore: row.priceStore,
    priceUpdatedAt: toIso(row.priceUpdatedAt),
    dateCompleted: toIso(row.dateCompleted),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toEntryWithGame(row: PrismaEntry & { game: PrismaGame }): EntryWithGame {
  return { ...toEntry(row), game: toGame(row.game) };
}

function parsePlatforms(json: string): number[] {
  const parsed: unknown = JSON.parse(json);
  return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
}
