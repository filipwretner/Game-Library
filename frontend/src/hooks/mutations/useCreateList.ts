import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CustomList } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';
import { customListKeys } from '../customListKeys.ts';

/** Create a list, then refresh the lists. */
export function useCreateList(): UseMutationResult<CustomList, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => listsApi.create(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customListKeys.all });
    },
  });
}
