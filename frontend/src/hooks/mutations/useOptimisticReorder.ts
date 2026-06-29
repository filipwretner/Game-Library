import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

interface Reorderable {
  id: number;
  rank: number | null;
}

interface ReorderContext<T> {
  previous: T[] | undefined;
}

export type OptimisticReorder<T> = UseMutationResult<T[], Error, number[], ReorderContext<T>>;

/**
 * The single source of truth for drag-and-drop reorder (spec §8.5): optimistically
 * reorders the cached list so the drag feels instant, rolls back on error, and
 * reconciles with the server on settle. Used by every list (core + custom).
 */
export function useOptimisticReorder<T extends Reorderable>(
  queryKey: QueryKey,
  reorderFn: (orderedIds: number[]) => Promise<T[]>,
): OptimisticReorder<T> {
  const queryClient = useQueryClient();

  return useMutation<T[], Error, number[], ReorderContext<T>>({
    mutationFn: reorderFn,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, reorderCached(previous, orderedIds));
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

function reorderCached<T extends Reorderable>(entries: T[], orderedIds: number[]): T[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return orderedIds.flatMap((id, index) => {
    const entry = byId.get(id);
    return entry ? [{ ...entry, rank: index + 1 }] : [];
  });
}
