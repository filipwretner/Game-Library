import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomList, CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';

/** All custom lists (spec §8.1 query hook). */
export function useCustomLists(): UseQueryResult<CustomList[]> {
  return useQuery({ queryKey: ['custom-lists'], queryFn: listsApi.list });
}

/** Ranked entries of one custom list. */
export function useCustomListEntries(listId: number): UseQueryResult<CustomListEntryWithGame[]> {
  return useQuery({
    queryKey: ['custom-list', listId, 'entries'],
    queryFn: () => listsApi.entries(listId),
  });
}
