import type { GameSearchResult } from '@game-tracker/shared';
import { apiGet } from './client.ts';

/** Typed wrapper for the games endpoints (spec §8.1). Only place that knows URLs. */
export const gamesApi = {
  search: (query: string): Promise<GameSearchResult[]> =>
    apiGet<GameSearchResult[]>(`/games/search?q=${encodeURIComponent(query)}`),
};
