import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { usePlayedEntries } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { RankRow } from '../../components/RankRow.tsx';

/**
 * Played list view (spec §8.5). Composition: search-to-add + the ranked list.
 * All data work lives in hooks; this file just wires them to presentational parts.
 */
export function PlayedView(): JSX.Element {
  const { data: entries, isPending, isError } = usePlayedEntries();
  const addEntry = useAddEntry();
  const deleteEntry = useDeleteEntry();

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'PLAYED' });
  };

  return (
    <section className="played-view">
      <h2>Played</h2>
      <AddGameModal onSelect={handleAdd} />

      {isPending && <p>Loading…</p>}
      {isError && <p role="alert">Could not load your Played list.</p>}
      {entries && entries.length === 0 && <p>No games yet — search above to add one.</p>}
      {entries && entries.length > 0 && (
        <ol className="rank-list">
          {entries.map((entry) => (
            <RankRow key={entry.id} entry={entry} onDelete={deleteEntry.mutate} />
          ))}
        </ol>
      )}
    </section>
  );
}
