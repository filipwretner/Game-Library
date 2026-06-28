import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { EntryWithGame } from '../../types/index.ts';
import { entriesApi } from '../../api/entriesApi.ts';

const PLAYED_KEY = ['entries', 'PLAYED'] as const;

interface ReorderContext {
  previous: EntryWithGame[] | undefined;
}

/**
 * Commit a Played reorder (spec §8.5). Optimistically reorders the cached list
 * so the drag feels instant, rolls back on error, and reconciles with the
 * server on settle. Server state still lives in TanStack Query.
 */
export function useReorderEntries(): UseMutationResult<
  EntryWithGame[],
  Error,
  number[],
  ReorderContext
> {
  const queryClient = useQueryClient();

  return useMutation<EntryWithGame[], Error, number[], ReorderContext>({
    mutationFn: (orderedIds: number[]) => entriesApi.reorder(orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: PLAYED_KEY });
      const previous = queryClient.getQueryData<EntryWithGame[]>(PLAYED_KEY);
      if (previous) {
        queryClient.setQueryData(PLAYED_KEY, reorderCached(previous, orderedIds));
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLAYED_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLAYED_KEY });
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
