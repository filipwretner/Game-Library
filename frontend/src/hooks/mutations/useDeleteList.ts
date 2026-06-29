import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';

/** Delete a list, then refresh the lists. */
export function useDeleteList(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => listsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customListKeys.all });
    },
  });
}
