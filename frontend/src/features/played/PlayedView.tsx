import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { usePlayedEntries } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { useReorderEntries } from '../../hooks/mutations/useReorderEntries.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { RankList } from '../../components/RankList.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

/**
 * Played list view (spec §8.5). Composition: search-to-add + the ranked list.
 * All data work lives in hooks; this file just wires them to presentational parts.
 */
export function PlayedView(): JSX.Element {
  const { data: entries, isPending, isError } = usePlayedEntries();
  const addEntry = useAddEntry();
  const deleteEntry = useDeleteEntry();
  const reorderEntries = useReorderEntries();

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'PLAYED' });
  };

  const actionError = firstErrorMessage([addEntry, deleteEntry, reorderEntries]);

  return (
    <section className="played-view">
      <h2>Played</h2>
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your Played list.' : null} />
      {entries && entries.length === 0 && <p>No games yet — search above to add one.</p>}
      {entries && entries.length > 0 && (
        <RankList
          entries={entries}
          onReorder={reorderEntries.mutate}
          onDelete={deleteEntry.mutate}
        />
      )}
    </section>
  );
}
