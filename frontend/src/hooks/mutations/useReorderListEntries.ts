import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CustomListEntryWithGame } from '../../types/index.ts';
import { listsApi } from '../../api/listsApi.ts';

interface ReorderContext {
  previous: CustomListEntryWithGame[] | undefined;
}

/**
 * Commit a drag-and-drop reorder of a custom list, optimistically reordering the
 * cached entries (mirrors useReorderEntries for the core lists).
 */
export function useReorderListEntries(
  listId: number,
): UseMutationResult<CustomListEntryWithGame[], Error, number[], ReorderContext> {
  const queryClient = useQueryClient();
  const key = ['custom-list', listId, 'entries'];

  return useMutation<CustomListEntryWithGame[], Error, number[], ReorderContext>({
    mutationFn: (orderedIds: number[]) => listsApi.reorder(listId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CustomListEntryWithGame[]>(key);
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

function reorderCached(
  entries: CustomListEntryWithGame[],
  orderedIds: number[],
): CustomListEntryWithGame[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return orderedIds.flatMap((id, index) => {
    const entry = byId.get(id);
    return entry ? [{ ...entry, rank: index + 1 }] : [];
  });
}
