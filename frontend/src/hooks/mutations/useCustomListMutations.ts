import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CustomList, CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';

const LISTS_KEY = ['custom-lists'];
const entriesKey = (listId: number): unknown[] => ['custom-list', listId, 'entries'];

/** Create a list, then refresh the lists. */
export function useCreateList(): UseMutationResult<CustomList, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => listsApi.create(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

/** Delete a list, then refresh the lists. */
export function useDeleteList(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => listsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

/** Add a searched game to a list, then refresh its entries. */
export function useAddListEntry(
  listId: number,
): UseMutationResult<CustomListEntryWithGame, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (igdbId: number) => listsApi.addEntry(listId, igdbId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entriesKey(listId) });
    },
  });
}

/** Remove an entry from a list, then refresh its entries. */
export function useRemoveListEntry(listId: number): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => listsApi.removeEntry(listId, entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entriesKey(listId) });
    },
  });
}
