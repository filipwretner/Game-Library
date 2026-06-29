import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useBacklog } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { useReorderEntries } from '../../hooks/mutations/useReorderEntries.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { SortableList } from '../../components/SortableList.tsx';
import { ListHeader } from '../../components/ListHeader.tsx';
import { Button } from '../../components/Button.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

/**
 * Backlog view (spec §8.5): owned-but-unplayed games, hand-ordered. Compose add +
 * sortable list; the move/complete logic lives in hooks.
 */
export function BacklogView(): JSX.Element {
  const { data: entries, isPending, isError } = useBacklog();
  const addEntry = useAddEntry();
  const moveEntry = useMoveEntry();
  const deleteEntry = useDeleteEntry();
  const reorderEntries = useReorderEntries('BACKLOG');

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'BACKLOG' });
  };
  const markCompleted = (id: number): void => {
    moveEntry.mutate({ id, status: 'PLAYED', dateCompleted: new Date().toISOString() });
  };
  const moveToWishlist = (id: number): void => {
    moveEntry.mutate({ id, status: 'WISHLIST' });
  };

  const actionError = firstErrorMessage([addEntry, moveEntry, deleteEntry, reorderEntries]);
  const hasEntries = entries !== undefined && entries.length > 0;

  return (
    <section className="space-y-4">
      <ListHeader
        title="Backlog"
        aside={hasEntries && <span className="text-sm text-muted">{entries.length} games</span>}
      />
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your Backlog.' : null} />
      {entries && entries.length === 0 && (
        <p className="text-muted">Backlog is empty — search above to add a game.</p>
      )}
      {hasEntries && (
        <SortableList
          entries={entries}
          onReorder={reorderEntries.mutate}
          onDelete={deleteEntry.mutate}
          renderActions={(entry) => (
            <>
              <Button onClick={() => markCompleted(entry.id)}>Mark completed</Button>
              <Button onClick={() => moveToWishlist(entry.id)}>To Wishlist</Button>
            </>
          )}
        />
      )}
    </section>
  );
}
