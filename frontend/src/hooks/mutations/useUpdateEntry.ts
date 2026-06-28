import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryWithGame } from '../../types/index.ts';
import { entriesApi, type UpdateEntryBody } from '../../api/entriesApi.ts';

export interface UpdateEntryVars {
  id: number;
  patch: UpdateEntryBody;
}

/** Patch an entry's fields (e.g. wishlist price, notes), then refresh the lists. */
export function useUpdateEntry(): UseMutationResult<EntryWithGame, Error, UpdateEntryVars> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateEntryVars) => entriesApi.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
