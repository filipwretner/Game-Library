import type { EntryStatus, EntryWithGame, Platform } from '../types/index.ts';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client.ts';

/** Body for adding a game to a list (mirrors POST /api/entries). */
export interface AddEntryBody {
  igdbId: number;
  status: EntryStatus;
  ownedPlatform?: Platform | null;
  dateCompleted?: string | null;
  notes?: string | null;
}

/** Partial update (mirrors PATCH /api/entries/:id). */
export interface UpdateEntryBody {
  status?: EntryStatus;
  rank?: number | null;
  ownedPlatform?: Platform | null;
  price?: number | null;
  normalPrice?: number | null;
  discountPct?: number | null;
  priceCurrency?: string | null;
  priceStore?: string | null;
  dateCompleted?: string | null;
  notes?: string | null;
}

/** Typed wrappers for the entries endpoints (spec §8.1). Only place that knows URLs. */
export const entriesApi = {
  list: (status: EntryStatus): Promise<EntryWithGame[]> =>
    apiGet<EntryWithGame[]>(`/entries?status=${status}`),
  create: (body: AddEntryBody): Promise<EntryWithGame> => apiPost<EntryWithGame>('/entries', body),
  update: (id: number, patch: UpdateEntryBody): Promise<EntryWithGame> =>
    apiPatch<EntryWithGame>(`/entries/${id}`, patch),
  remove: (id: number): Promise<void> => apiDelete(`/entries/${id}`),
  reorder: (orderedEntryIds: number[]): Promise<EntryWithGame[]> =>
    apiPut<EntryWithGame[]>('/entries/rank', { orderedEntryIds }),
};
