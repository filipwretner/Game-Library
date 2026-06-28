import type { JSX } from 'react';
import { preferredPlatform } from '@game-tracker/shared';
import type { EntryWithGame } from '../../types/index.ts';
import { GameCard } from '../../components/GameCard.tsx';
import { PriceEditor } from '../../components/PriceEditor.tsx';
import { PriceTag } from '../../components/PriceTag.tsx';
import { SaleBadge } from '../../components/SaleBadge.tsx';

interface WishlistCardProps {
  entry: EntryWithGame;
  isFetching: boolean;
  onDelete: (id: number) => void;
  onFetchPrice: (id: number) => void;
  onSavePrice: (id: number, price: number) => void;
  onMoveToBacklog: (id: number) => void;
}

/**
 * One wishlist row: price + sale display, plus PC auto-fetch or PS5 manual entry
 * (spec §6/§8.5). The PC-vs-PS5 decision comes from the shared platform rule.
 */
export function WishlistCard({
  entry,
  isFetching,
  onDelete,
  onFetchPrice,
  onSavePrice,
  onMoveToBacklog,
}: Readonly<WishlistCardProps>): JSX.Element {
  const isPc = preferredPlatform(entry.game.platforms) === 'PC';

  return (
    <GameCard entry={entry} onDelete={onDelete}>
      <PriceTag
        price={entry.price}
        normalPrice={entry.normalPrice}
        discountPct={entry.discountPct}
        currency={entry.priceCurrency}
      />
      <SaleBadge discountPct={entry.discountPct} />
      {isPc ? (
        <button type="button" disabled={isFetching} onClick={() => onFetchPrice(entry.id)}>
          Fetch price
        </button>
      ) : (
        <PriceEditor
          price={entry.price}
          currency={entry.priceCurrency}
          onSave={(price) => onSavePrice(entry.id, price)}
        />
      )}
      <button type="button" onClick={() => onMoveToBacklog(entry.id)}>
        To Backlog
      </button>
    </GameCard>
  );
}
