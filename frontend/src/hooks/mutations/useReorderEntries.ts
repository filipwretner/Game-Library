import type { EntryStatus, EntryWithGame } from '../../types/index.ts';
import { entriesApi } from '../../api/entriesApi.ts';
import { entryKeys } from '../entryKeys.ts';
import { useOptimisticReorder, type OptimisticReorder } from './useOptimisticReorder.ts';

/** Optimistic drag-and-drop reorder of one core list (Played / Backlog / Wishlist). */
export function useReorderEntries(status: EntryStatus): OptimisticReorder<EntryWithGame> {
  return useOptimisticReorder<EntryWithGame>(entryKeys.list(status), (ids) =>
    entriesApi.reorder(status, ids),
  );
}
