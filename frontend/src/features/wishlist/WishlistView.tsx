import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useWishlist } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useUpdateEntry } from '../../hooks/mutations/useUpdateEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { useFetchPrice } from '../../hooks/mutations/useFetchPrice.ts';
import { useReorderEntries } from '../../hooks/mutations/useReorderEntries.ts';
import { useWishlistTotal } from '../../hooks/logic/useWishlistTotal.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { WishlistActions } from './WishlistActions.tsx';
import { SortableList } from '../../components/SortableList.tsx';
import { ListHeader } from '../../components/ListHeader.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

const CURRENCY = 'USD';
const MONEY_DECIMALS = 2;

/**
 * Wishlist view (spec §8.5): wanted games with a price, hand-ordered. PC items
 * auto-fetch via CheapShark; PS5/other items use manual entry. Header shows the
 * USD total.
 */
export function WishlistView(): JSX.Element {
  const { data: entries, isPending, isError } = useWishlist();
  const addEntry = useAddEntry();
  const moveEntry = useMoveEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const fetchPrice = useFetchPrice();
  const reorderEntries = useReorderEntries('WISHLIST');
  const total = useWishlistTotal(entries);

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'WISHLIST' });
  };

  const actionError = firstErrorMessage([
    addEntry,
    moveEntry,
    updateEntry,
    deleteEntry,
    fetchPrice,
    reorderEntries,
  ]);
  const hasEntries = entries !== undefined && entries.length > 0;
  const totalLabel = `Total: ${CURRENCY} ${total.toFixed(MONEY_DECIMALS)}`;

  return (
    <section className="space-y-4">
      <ListHeader
        title="Wishlist"
        aside={hasEntries && <span className="text-sm font-medium text-muted">{totalLabel}</span>}
      />
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your Wishlist.' : null} />
      {entries && entries.length === 0 && (
        <p className="text-muted">Wishlist is empty — search above to add a game.</p>
      )}
      {hasEntries && (
        <SortableList
          entries={entries}
          onReorder={reorderEntries.mutate}
          onDelete={deleteEntry.mutate}
          renderActions={(entry) => (
            <WishlistActions
              entry={entry}
              isFetching={fetchPrice.isPending && fetchPrice.variables === entry.id}
              onFetchPrice={fetchPrice.mutate}
              onSavePrice={(id, price) =>
                updateEntry.mutate({ id, patch: { price, priceCurrency: CURRENCY } })
              }
              onMoveToBacklog={(id) => moveEntry.mutate({ id, status: 'BACKLOG' })}
            />
          )}
        />
      )}
    </section>
  );
}
