import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryWithGame } from '../../types/index.ts';
import { entriesApi, type AddEntryBody } from '../../api/entriesApi.ts';

/** Add a game to a list, then refresh the affected lists (spec §8.1 mutation hook). */
export function useAddEntry(): UseMutationResult<EntryWithGame, Error, AddEntryBody> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddEntryBody) => entriesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
