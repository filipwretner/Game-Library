import { BadGatewayError } from '../../domain/errors.js';

/**
 * Thin CheapShark transport (spec §2.2, §9). Free, no auth, but requires a
 * User-Agent and must only be called on demand (never in a loop over a list).
 * Knows nothing about deal selection — that's the provider + domain rule.
 *
 * Prices are scoped to a single game (title → best-matching gameID → that game's
 * deals) so we never return a cheaper, similarly-named game's price.
 */

const BASE_URL = 'https://www.cheapshark.com/api/1.0';
const USER_AGENT = 'GameTracker/1.0 (personal, non-commercial)';
const TITLE_MATCH_LIMIT = 1;

export interface CheapsharkClient {
  /** Best-matching game summaries for a title (we use the top match). */
  gameSummaries(title: string): Promise<unknown>;
  /** Full detail for one game, including its current deals. */
  gameDeals(gameId: string): Promise<unknown>;
  stores(): Promise<unknown>;
}

export function createCheapsharkClient(): CheapsharkClient {
  async function get(path: string): Promise<unknown> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      throw new BadGatewayError(`CheapShark request failed (${res.status})`);
    }
    return res.json();
  }

  return {
    gameSummaries: (title) =>
      get(`/games?title=${encodeURIComponent(title)}&limit=${TITLE_MATCH_LIMIT}`),
    gameDeals: (gameId) => get(`/games?id=${encodeURIComponent(gameId)}`),
    stores: () => get('/stores'),
  };
}
