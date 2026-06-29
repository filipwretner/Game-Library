import type { CustomList, CustomListEntryWithGame } from '../types/index.ts';
import { apiDelete, apiGet, apiPost, apiPut } from './client.ts';

/** Typed wrappers for the custom-list endpoints (spec §8.1). Only place that knows URLs. */
export const listsApi = {
  list: (): Promise<CustomList[]> => apiGet<CustomList[]>('/lists'),
  create: (title: string): Promise<CustomList> => apiPost<CustomList>('/lists', { title }),
  remove: (id: number): Promise<void> => apiDelete(`/lists/${id}`),
  entries: (listId: number): Promise<CustomListEntryWithGame[]> =>
    apiGet<CustomListEntryWithGame[]>(`/lists/${listId}/entries`),
  addEntry: (listId: number, igdbId: number): Promise<CustomListEntryWithGame> =>
    apiPost<CustomListEntryWithGame>(`/lists/${listId}/entries`, { igdbId }),
  removeEntry: (listId: number, entryId: number): Promise<void> =>
    apiDelete(`/lists/${listId}/entries/${entryId}`),
  reorder: (listId: number, orderedEntryIds: number[]): Promise<CustomListEntryWithGame[]> =>
    apiPut<CustomListEntryWithGame[]>(`/lists/${listId}/rank`, { orderedEntryIds }),
};
