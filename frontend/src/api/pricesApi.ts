import type { EntryWithGame } from '../types/index.ts';
import { apiPost } from './client.ts';

/** Pricing endpoints (spec §8.1). Auto-fetch is PC-only; PS5 uses manual PATCH. */
export const pricesApi = {
  fetch: (entryId: number): Promise<EntryWithGame> =>
    apiPost<EntryWithGame>(`/entries/${entryId}/fetch-price`, {}),
};
