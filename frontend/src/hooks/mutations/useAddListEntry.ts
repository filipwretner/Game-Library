import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';

/** Add a searched game to a list, then refresh its entries. */
export function useAddListEntry(
  listId: number,
): UseMutationResult<CustomListEntryWithGame, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (igdbId: number) => listsApi.addEntry(listId, igdbId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customListKeys.entries(listId) });
    },
  });
}
