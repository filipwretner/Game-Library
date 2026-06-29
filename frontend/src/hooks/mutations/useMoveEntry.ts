import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryStatus, EntryWithGame } from '../../types/index.ts';
import { entriesApi } from '../../api/entriesApi.ts';
import { entryKeys } from '../entryKeys.ts';

export interface MoveEntryVars {
  id: number;
  status: EntryStatus;
  /** Set when moving to PLAYED (completion date). Backend clears/sets the rest. */
  dateCompleted?: string | null;
}

/**
 * Move an entry between lists (spec §8.5). Only changes status (+ optional
 * completion date); the backend clears the old list's fields and assigns a rank.
 */
export function useMoveEntry(): UseMutationResult<EntryWithGame, Error, MoveEntryVars> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, dateCompleted }: MoveEntryVars) =>
      entriesApi.update(id, { status, dateCompleted }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}
