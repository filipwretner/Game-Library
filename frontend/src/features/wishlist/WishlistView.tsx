import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useWishlist } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useUpdateEntry } from '../../hooks/mutations/useUpdateEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { useFetchPrice } from '../../hooks/mutations/useFetchPrice.ts';
import { useWishlistTotal } from '../../hooks/logic/useWishlistTotal.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { WishlistCard } from './WishlistCard.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

const CURRENCY = 'USD';
const MONEY_DECIMALS = 2;

/**
 * Wishlist view (spec §8.5): wanted games with a price. PC items auto-fetch via
 * CheapShark; PS5/other items use manual entry. The header shows the USD total.
 */
export function WishlistView(): JSX.Element {
  const { data: entries, isPending, isError } = useWishlist();
  const addEntry = useAddEntry();
  const moveEntry = useMoveEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const fetchPrice = useFetchPrice();
  const total = useWishlistTotal(entries);

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'WISHLIST' });
  };
  const savePrice = (id: number, price: number): void => {
    updateEntry.mutate({ id, patch: { price, priceCurrency: CURRENCY } });
  };
  const moveToBacklog = (id: number): void => {
    moveEntry.mutate({ id, status: 'BACKLOG' });
  };

  const hasEntries = entries !== undefined && entries.length > 0;
  const actionError = firstErrorMessage([
    addEntry,
    moveEntry,
    updateEntry,
    deleteEntry,
    fetchPrice,
  ]);

  return (
    <section className="wishlist-view">
      <h2>Wishlist</h2>
      {hasEntries && (
        <p className="wishlist-total">
          Total: {CURRENCY} {total.toFixed(MONEY_DECIMALS)}
        </p>
      )}
      <AddGameModal onSelect={handleAdd} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your Wishlist.' : null} />
      {entries && entries.length === 0 && <p>Wishlist is empty — search above to add a game.</p>}
      {hasEntries && (
        <ul className="card-list">
          {entries.map((entry) => (
            <WishlistCard
              key={entry.id}
              entry={entry}
              isFetching={fetchPrice.isPending && fetchPrice.variables === entry.id}
              onDelete={deleteEntry.mutate}
              onFetchPrice={fetchPrice.mutate}
              onSavePrice={savePrice}
              onMoveToBacklog={moveToBacklog}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
