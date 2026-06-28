import type { GameMetadata, GameSearchResult, PriceQuote } from '@game-tracker/shared';

/**
 * Integration ports (spec §7.1 layer 5, §2.2). External APIs sit behind these
 * interfaces; services depend on the interface, so CheapShark → ITAD is a
 * one-file swap. Concrete clients live in integrations/igdb|cheapshark/.
 */

/** Search results reuse the cross-stack contract from shared/ (no duplication). */
export type MetadataSearchResult = GameSearchResult;

export interface MetadataProvider {
  search(query: string): Promise<MetadataSearchResult[]>;
  /** Full metadata for one game by IGDB id, or null if not found. */
  getByIgdbId(igdbId: number): Promise<GameMetadata | null>;
}

export interface PriceProvider {
  getBestPrice(title: string): Promise<PriceQuote | null>;
}
