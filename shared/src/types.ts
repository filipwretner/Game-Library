/**
 * Cross-stack data contracts (spec §5, §8.3). Defined once here, imported by
 * backend and frontend so the shapes never drift. Ordinal-only ranking: there
 * is no `rating` field (decision §5.1).
 */

import type { Platform } from './domain/platform.js';

export type EntryStatus = 'PLAYED' | 'BACKLOG' | 'WISHLIST';

/** Cached metadata from IGDB (spec §5 `games`). */
export interface Game {
  id: number;
  igdbId: number;
  title: string;
  coverUrl: string | null;
  summary: string | null;
  releaseDate: string | null;
  platforms: number[];
  igdbRating: number | null;
  cachedAt: string;
}

/** A game's presence on exactly one list (spec §5 `entries`). */
export interface Entry {
  id: number;
  gameId: number;
  status: EntryStatus;
  /** Position within PLAYED, 1 = best. Null for other statuses. */
  rank: number | null;
  /** Which version is owned/played (BACKLOG/PLAYED). */
  ownedPlatform: Platform | null;
  /** WISHLIST: current/sale price. Auto-filled (PC) or manual (PS5). */
  price: number | null;
  /** WISHLIST + PC: regular price for strike-through display. */
  normalPrice: number | null;
  /** WISHLIST + PC: discount percentage when on sale. */
  discountPct: number | null;
  priceCurrency: string | null;
  priceStore: string | null;
  priceUpdatedAt: string | null;
  dateCompleted: string | null;
  notes: string | null;
  createdAt: string;
}

/** A game candidate returned by metadata search (IGDB), shown when adding. */
export interface GameSearchResult {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  platforms: number[];
}

/** Full metadata for one game from IGDB — the upsert input for the `games` table. */
export interface GameMetadata {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  summary: string | null;
  releaseDate: string | null;
  platforms: number[];
  igdbRating: number | null;
}

/** An entry joined with its cached game metadata — the list/read shape. */
export interface EntryWithGame extends Entry {
  game: Game;
}

/** A normalised price result from a PriceProvider (CheapShark today). */
export interface PriceQuote {
  price: number;
  normalPrice: number;
  discountPct: number;
  currency: string;
  store: string;
  dealUrl: string | null;
}
