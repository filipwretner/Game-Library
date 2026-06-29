import type { JSX } from 'react';
import { preferredPlatform } from '@game-tracker/shared';
import type { EntryWithGame } from '../../types/index.ts';
import { PriceEditor } from '../../components/PriceEditor.tsx';
import { PriceTag } from '../../components/PriceTag.tsx';
import { SaleBadge } from '../../components/SaleBadge.tsx';
import { Button } from '../../components/Button.tsx';

interface WishlistActionsProps {
  entry: EntryWithGame;
  isFetching: boolean;
  onFetchPrice: (id: number) => void;
  onSavePrice: (id: number, price: number) => void;
  onMoveToBacklog: (id: number) => void;
}

/**
 * Bottom-row content for a wishlist card: price + sale display, then PC
 * auto-fetch or PS5 manual entry (spec §6/§8.5), plus "To Backlog". The PC-vs-PS5
 * decision comes from the shared platform rule.
 */
export function WishlistActions({
  entry,
  isFetching,
  onFetchPrice,
  onSavePrice,
  onMoveToBacklog,
}: Readonly<WishlistActionsProps>): JSX.Element {
  const isPc = preferredPlatform(entry.game.platforms) === 'PC';
  return (
    <>
      <PriceTag
        price={entry.price}
        normalPrice={entry.normalPrice}
        discountPct={entry.discountPct}
        currency={entry.priceCurrency}
      />
      <SaleBadge discountPct={entry.discountPct} />
      {isPc ? (
        <Button disabled={isFetching} onClick={() => onFetchPrice(entry.id)}>
          Fetch price
        </Button>
      ) : (
        <PriceEditor
          price={entry.price}
          currency={entry.priceCurrency}
          onSave={(price) => onSavePrice(entry.id, price)}
        />
      )}
      <Button onClick={() => onMoveToBacklog(entry.id)}>To Backlog</Button>
    </>
  );
}
