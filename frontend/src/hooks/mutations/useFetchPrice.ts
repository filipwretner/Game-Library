import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryWithGame } from '../../types/index.ts';
import { pricesApi } from '../../api/pricesApi.ts';
import { entryKeys } from '../entryKeys.ts';

/** Auto-fetch a PC wishlist item's price (spec §8.5), then refresh the lists. */
export function useFetchPrice(): UseMutationResult<EntryWithGame, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => pricesApi.fetch(entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}
