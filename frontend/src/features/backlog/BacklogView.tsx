import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useBacklog } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { GameCard } from '../../components/GameCard.tsx';

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

  return (
    <section className="backlog-view">
      <h2>Backlog</h2>
      <AddGameModal onSelect={handleAdd} />

      {isPending && <p>Loading…</p>}
      {isError && <p role="alert">Could not load your Backlog.</p>}
      {entries && entries.length === 0 && <p>Backlog is empty — search above to add a game.</p>}
      {entries && entries.length > 0 && (
        <ul className="card-list">
          {entries.map((entry) => (
            <GameCard key={entry.id} entry={entry} onDelete={deleteEntry.mutate}>
              <button type="button" onClick={() => markCompleted(entry.id)}>
                Mark completed
              </button>
              <button type="button" onClick={() => moveToWishlist(entry.id)}>
                To Wishlist
              </button>
            </GameCard>
          ))}
        </ul>
      )}
    </section>
  );
}
