import type { MetadataProvider, MetadataSearchResult } from '../integrations/ports.js';

/**
 * Search use case (spec §7.1 layer 2). Depends only on the MetadataProvider
 * port, so the IGDB client can be swapped or faked without touching this class.
 */
export class SearchService {
  constructor(private readonly metadata: MetadataProvider) {}

  searchGames(query: string): Promise<MetadataSearchResult[]> {
    return this.metadata.search(query.trim());
  }
}
