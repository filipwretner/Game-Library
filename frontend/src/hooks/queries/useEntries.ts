import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { EntryStatus, EntryWithGame } from '../../types/index.ts';
import { entriesApi } from '../../api/entriesApi.ts';
import { entryKeys } from '../entryKeys.ts';

/** Read the entries on one list (spec §8.1 query hook). Server state stays in the cache. */
export function useEntries(status: EntryStatus): UseQueryResult<EntryWithGame[]> {
  return useQuery({
    queryKey: entryKeys.list(status),
    queryFn: () => entriesApi.list(status),
  });
}

export function usePlayedEntries(): UseQueryResult<EntryWithGame[]> {
  return useEntries('PLAYED');
}

export function useBacklog(): UseQueryResult<EntryWithGame[]> {
  return useEntries('BACKLOG');
}

export function useWishlist(): UseQueryResult<EntryWithGame[]> {
  return useEntries('WISHLIST');
}
