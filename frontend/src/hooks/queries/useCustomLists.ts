import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomList, CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';

/** All custom lists (spec §8.1 query hook). */
export function useCustomLists(): UseQueryResult<CustomList[]> {
  return useQuery({ queryKey: customListKeys.all, queryFn: listsApi.list });
}

/** One custom list's metadata (e.g. its title). */
export function useCustomList(listId: number): UseQueryResult<CustomList> {
  return useQuery({ queryKey: customListKeys.list(listId), queryFn: () => listsApi.get(listId) });
}

/** Ranked entries of one custom list. */
export function useCustomListEntries(listId: number): UseQueryResult<CustomListEntryWithGame[]> {
  return useQuery({
    queryKey: customListKeys.entries(listId),
    queryFn: () => listsApi.entries(listId),
  });
}
