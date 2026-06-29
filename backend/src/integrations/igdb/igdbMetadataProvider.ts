import type { GameMetadata } from '@game-tracker/shared';
import type { IgdbClient } from './igdbClient.js';
import type { MetadataProvider, MetadataSearchResult } from '../ports.js';

/**
 * Maps IGDB's Apicalypse responses onto the MetadataProvider port (spec §7.1
 * layer 5). Services depend on the port, never on this class or IGDB shapes.
 */

const SEARCH_LIMIT = 15;
const THUMB_SIZE = 't_thumb';
const COVER_SIZE = 't_cover_big';
const MS_PER_SECOND = 1000;
/** IGDB game_type 0 = main_game. Filters out DLC/cosmetic packs, editions, etc. */
const MAIN_GAME_TYPE = 0;

interface IgdbSearchRow {
  id: number;
  name: string;
  cover?: { url?: string };
  platforms?: number[];
  first_release_date?: number;
}

interface IgdbGameRow extends IgdbSearchRow {
  summary?: string;
  first_release_date?: number;
  rating?: number;
}

export class IgdbMetadataProvider implements MetadataProvider {
  constructor(private readonly client: IgdbClient) {}

  async search(query: string): Promise<MetadataSearchResult[]> {
    const body = buildSearchQuery(query);
    const rows = (await this.client.query('games', body)) as IgdbSearchRow[];
    return rows.map(toSearchResult);
  }

  async getByIgdbId(igdbId: number): Promise<GameMetadata | null> {
    const body = buildByIdQuery(igdbId);
    const rows = (await this.client.query('games', body)) as IgdbGameRow[];
    const row = rows[0];
    return row ? toMetadata(row) : null;
  }
}

function buildSearchQuery(query: string): string {
  // Escape embedded quotes so the Apicalypse string stays well-formed.
  const safe = query.replace(/"/g, '\\"');
  return (
    `search "${safe}"; fields name,cover.url,platforms,first_release_date; ` +
    `where game_type = ${MAIN_GAME_TYPE}; limit ${SEARCH_LIMIT};`
  );
}

function buildByIdQuery(igdbId: number): string {
  return `fields name,cover.url,platforms,summary,first_release_date,rating; where id = ${igdbId}; limit 1;`;
}

function toSearchResult(row: IgdbSearchRow): MetadataSearchResult {
  return {
    igdbId: row.id,
    title: row.name,
    coverUrl: upgradeCoverUrl(row.cover?.url),
    platforms: row.platforms ?? [],
    releaseDate: unixToIso(row.first_release_date),
  };
}

function toMetadata(row: IgdbGameRow): GameMetadata {
  return {
    igdbId: row.id,
    title: row.name,
    coverUrl: upgradeCoverUrl(row.cover?.url),
    summary: row.summary ?? null,
    releaseDate: unixToIso(row.first_release_date),
    platforms: row.platforms ?? [],
    igdbRating: row.rating ?? null,
  };
}

/** IGDB dates are unix seconds; convert to an ISO string (or null). */
function unixToIso(seconds: number | undefined): string | null {
  return seconds === undefined ? null : new Date(seconds * MS_PER_SECOND).toISOString();
}

/** IGDB returns protocol-relative thumbnail URLs; upgrade to https + big art. */
function upgradeCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  const big = url.replace(THUMB_SIZE, COVER_SIZE);
  return big.startsWith('//') ? `https:${big}` : big;
}
