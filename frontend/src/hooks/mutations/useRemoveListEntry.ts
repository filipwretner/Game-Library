import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';

/** Remove an entry from a list, then refresh its entries. */
export function useRemoveListEntry(listId: number): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => listsApi.removeEntry(listId, entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customListKeys.entries(listId) });
    },
  });
}
