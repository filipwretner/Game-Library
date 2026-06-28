import type { IgdbClient } from './igdbClient.js';
import type { MetadataProvider, MetadataSearchResult } from '../ports.js';

/**
 * Maps IGDB's Apicalypse responses onto the MetadataProvider port (spec §7.1
 * layer 5). Services depend on the port, never on this class or IGDB shapes.
 */

const SEARCH_LIMIT = 10;
const THUMB_SIZE = 't_thumb';
const COVER_SIZE = 't_cover_big';

interface IgdbSearchRow {
  id: number;
  name: string;
  cover?: { url?: string };
  platforms?: number[];
}

export class IgdbMetadataProvider implements MetadataProvider {
  constructor(private readonly client: IgdbClient) {}

  async search(query: string): Promise<MetadataSearchResult[]> {
    const body = buildSearchQuery(query);
    const rows = (await this.client.query('games', body)) as IgdbSearchRow[];
    return rows.map(toSearchResult);
  }
}

function buildSearchQuery(query: string): string {
  // Escape embedded quotes so the Apicalypse string stays well-formed.
  const safe = query.replace(/"/g, '\\"');
  return `search "${safe}"; fields name,cover.url,platforms,first_release_date,summary; limit ${SEARCH_LIMIT};`;
}

function toSearchResult(row: IgdbSearchRow): MetadataSearchResult {
  return {
    igdbId: row.id,
    title: row.name,
    coverUrl: upgradeCoverUrl(row.cover?.url),
    platforms: row.platforms ?? [],
  };
}

/** IGDB returns protocol-relative thumbnail URLs; upgrade to https + big art. */
function upgradeCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  const big = url.replace(THUMB_SIZE, COVER_SIZE);
  return big.startsWith('//') ? `https:${big}` : big;
}
