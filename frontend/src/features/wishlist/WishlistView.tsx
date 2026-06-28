import type { JSX } from 'react';
import type { GameSearchResult } from '../../types/index.ts';
import { useWishlist } from '../../hooks/queries/useEntries.ts';
import { useAddEntry } from '../../hooks/mutations/useAddEntry.ts';
import { useMoveEntry } from '../../hooks/mutations/useMoveEntry.ts';
import { useUpdateEntry } from '../../hooks/mutations/useUpdateEntry.ts';
import { useDeleteEntry } from '../../hooks/mutations/useDeleteEntry.ts';
import { AddGameModal } from '../add-game/AddGameModal.tsx';
import { GameCard } from '../../components/GameCard.tsx';
import { PriceEditor } from '../../components/PriceEditor.tsx';

const CURRENCY = 'USD';

/**
 * Wishlist view (spec §8.5): wanted games with a price. Manual price entry for
 * now; PC auto-fetch (CheapShark) and the wishlist total arrive in Milestone 6.
 */
export function WishlistView(): JSX.Element {
  const { data: entries, isPending, isError } = useWishlist();
  const addEntry = useAddEntry();
  const moveEntry = useMoveEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const handleAdd = (game: GameSearchResult): void => {
    addEntry.mutate({ igdbId: game.igdbId, status: 'WISHLIST' });
  };
  const savePrice = (id: number, price: number): void => {
    updateEntry.mutate({ id, patch: { price, priceCurrency: CURRENCY } });
  };
  const moveToBacklog = (id: number): void => {
    moveEntry.mutate({ id, status: 'BACKLOG' });
  };

  return (
    <section className="wishlist-view">
      <h2>Wishlist</h2>
      <AddGameModal onSelect={handleAdd} />

      {isPending && <p>Loading…</p>}
      {isError && <p role="alert">Could not load your Wishlist.</p>}
      {entries && entries.length === 0 && <p>Wishlist is empty — search above to add a game.</p>}
      {entries && entries.length > 0 && (
        <ul className="card-list">
          {entries.map((entry) => (
            <GameCard key={entry.id} entry={entry} onDelete={deleteEntry.mutate}>
              <PriceEditor
                price={entry.price}
                currency={entry.priceCurrency}
                onSave={(price) => savePrice(entry.id, price)}
              />
              <button type="button" onClick={() => moveToBacklog(entry.id)}>
                To Backlog
              </button>
            </GameCard>
          ))}
        </ul>
      )}
    </section>
  );
}
