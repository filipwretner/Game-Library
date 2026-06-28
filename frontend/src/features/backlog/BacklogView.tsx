import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useBacklog } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { GameCard } from '../../components/GameCard.tsx';
import { Button } from '../../components/Button.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

/**
 * Backlog view (spec §8.5): owned-but-unplayed games. Compose add + cards; the
 * move/complete logic lives in hooks, cards stay presentational.
 */
export function BacklogView(): JSX.Element {
  const { data: entries, isPending, isError } = useBacklog();
  const addEntry = useAddEntry();
  const moveEntry = useMoveEntry();
  const deleteEntry = useDeleteEntry();

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'BACKLOG' });
  };
  const markCompleted = (id: number): void => {
    moveEntry.mutate({ id, status: 'PLAYED', dateCompleted: new Date().toISOString() });
  };
  const moveToWishlist = (id: number): void => {
    moveEntry.mutate({ id, status: 'WISHLIST' });
  };

  const actionError = firstErrorMessage([addEntry, moveEntry, deleteEntry]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Backlog</h2>
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your Backlog.' : null} />
      {entries && entries.length === 0 && (
        <p className="text-muted">Backlog is empty — search above to add a game.</p>
      )}
      {entries && entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <GameCard key={entry.id} entry={entry} onDelete={deleteEntry.mutate}>
              <Button onClick={() => markCompleted(entry.id)}>Mark completed</Button>
              <Button onClick={() => moveToWishlist(entry.id)}>To Wishlist</Button>
            </GameCard>
          ))}
        </ul>
      )}
    </section>
  );
}
