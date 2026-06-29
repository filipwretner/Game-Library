import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useCustomLists, useCustomListEntries } from '../../hooks/queries/useCustomLists.ts';
import {
  useAddListEntry,
  useRemoveListEntry,
} from '../../hooks/mutations/useCustomListMutations.ts';
import { useReorderListEntries } from '../../hooks/mutations/useReorderListEntries.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { SortableList } from '../../components/SortableList.tsx';
import { ListHeader } from '../../components/ListHeader.tsx';
import { Button } from '../../components/Button.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

interface ListDetailProps {
  listId: number;
  onBack: () => void;
}

/** One custom list: title heading + Played-style add and drag-to-reorder. */
export function ListDetail({ listId, onBack }: Readonly<ListDetailProps>): JSX.Element {
  const { data: lists } = useCustomLists();
  const { data: entries, isPending, isError } = useCustomListEntries(listId);
  const addEntry = useAddListEntry(listId);
  const removeEntry = useRemoveListEntry(listId);
  const reorder = useReorderListEntries(listId);

  const title = lists?.find((l) => l.id === listId)?.title ?? 'List';
  const actionError = firstErrorMessage([addEntry, removeEntry, reorder]);
  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate(game.igdbId);
  };

  return (
    <section className="space-y-4">
      <ListHeader
        title={title}
        aside={
          <span className="flex items-center gap-3">
            <span className="text-sm text-muted">{entries?.length ?? 0} games</span>
            <Button onClick={onBack}>← Back</Button>
          </span>
        }
      />
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load this list.' : null} />
      {entries && entries.length === 0 && (
        <p className="text-muted">Empty — search above to add a game.</p>
      )}
      {entries && entries.length > 0 && (
        <SortableList entries={entries} onReorder={reorder.mutate} onDelete={removeEntry.mutate} />
      )}
    </section>
  );
}
