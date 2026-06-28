import { BadGatewayError } from '../../domain/errors.js';

/**
 * Thin CheapShark transport (spec §2.2, §9). Free, no auth, but requires a
 * User-Agent and must only be called on demand (never in a loop over a list).
 * Knows nothing about deal selection — that's the provider + domain rule.
 */

const BASE_URL = 'https://www.cheapshark.com/api/1.0';
const USER_AGENT = 'GameTracker/1.0 (personal, non-commercial)';
const DEALS_LIMIT = 20;

export interface CheapsharkClient {
  deals(title: string): Promise<unknown>;
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
    deals: (title) => get(`/deals?title=${encodeURIComponent(title)}&limit=${DEALS_LIMIT}`),
    stores: () => get('/stores'),
  };
}
