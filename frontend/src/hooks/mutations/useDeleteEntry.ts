import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { entriesApi } from '../../api/entriesApi.ts';
import { entryKeys } from '../entryKeys.ts';

/** Remove an entry from all lists, then refresh (spec §8.1 mutation hook). */
export function useDeleteEntry(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entriesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}
