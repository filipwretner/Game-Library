import type { PriceQuote } from '@game-tracker/shared';

/**
 * Integration ports (spec §7.1 layer 5, §2.2). External APIs sit behind these
 * interfaces; services depend on the interface, so CheapShark → ITAD is a
 * one-file swap. Concrete clients live in integrations/igdb|cheapshark/.
 */

export interface MetadataSearchResult {
  igdbId: number;
  title: string;
  coverUrl: string | null;
  platforms: number[];
}

export interface MetadataProvider {
  search(query: string): Promise<MetadataSearchResult[]>;
}

export interface PriceProvider {
  getBestPrice(title: string): Promise<PriceQuote | null>;
}
