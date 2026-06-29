import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryStatus, EntryWithGame } from '../../types/index.ts';
import { entriesApi } from '../../api/entriesApi.ts';

interface ReorderContext {
  previous: EntryWithGame[] | undefined;
}

/**
 * Commit a drag-and-drop reorder of one list (spec §8.5). Optimistically reorders
 * the cached list so the drag feels instant, rolls back on error, and reconciles
 * with the server on settle. Server state still lives in TanStack Query.
 */
export function useReorderEntries(
  status: EntryStatus,
): UseMutationResult<EntryWithGame[], Error, number[], ReorderContext> {
  const queryClient = useQueryClient();
  const key = ['entries', status];

  return useMutation<EntryWithGame[], Error, number[], ReorderContext>({
    mutationFn: (orderedIds: number[]) => entriesApi.reorder(status, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<EntryWithGame[]>(key);
      if (previous) {
        queryClient.setQueryData(key, reorderCached(previous, orderedIds));
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

function reorderCached(entries: EntryWithGame[], orderedIds: number[]): EntryWithGame[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return orderedIds.flatMap((id, index) => {
    const entry = byId.get(id);
    return entry ? [{ ...entry, rank: index + 1 }] : [];
  });
}
