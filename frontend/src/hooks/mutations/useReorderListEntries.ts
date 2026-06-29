import type { CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';
import { useOptimisticReorder, type OptimisticReorder } from './useOptimisticReorder.ts';

/** Optimistic drag-and-drop reorder of a custom list. */
export function useReorderListEntries(listId: number): OptimisticReorder<CustomListEntryWithGame> {
  return useOptimisticReorder<CustomListEntryWithGame>(customListKeys.entries(listId), (ids) =>
    listsApi.reorder(listId, ids),
  );
}
