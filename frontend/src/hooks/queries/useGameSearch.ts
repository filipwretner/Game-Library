import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { GameSearchResult } from '@game-tracker/shared';
import { gamesApi } from '../../api/gamesApi.ts';
import { useDebouncedValue } from '../logic/useDebouncedValue.ts';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Debounced game search (spec §8.5). Only fires once the query settles and is
 * long enough; server state stays in TanStack Query.
 */
export function useGameSearch(rawQuery: string): UseQueryResult<GameSearchResult[]> {
  const query = useDebouncedValue(rawQuery.trim(), DEBOUNCE_MS);

  return useQuery({
    queryKey: ['games', 'search', query],
    queryFn: () => gamesApi.search(query),
    enabled: query.length >= MIN_QUERY_LENGTH,
  });
}
