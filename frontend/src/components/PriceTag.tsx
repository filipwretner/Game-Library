import type { JSX } from 'react';

const PRICE_DECIMALS = 2;

interface PriceTagProps {
  price: number | null;
  normalPrice: number | null;
  discountPct: number | null;
  currency: string | null;
}

function format(currency: string | null, amount: number): string {
  return `${currency ?? 'USD'} ${amount.toFixed(PRICE_DECIMALS)}`;
}

/**
 * Presentational price display. Shows the current price, with the regular price
 * struck through when the item is on sale (spec §8.5).
 */
export function PriceTag({
  price,
  normalPrice,
  discountPct,
  currency,
}: Readonly<PriceTagProps>): JSX.Element {
  if (price === null) {
    return <span className="text-sm text-muted">No price yet</span>;
  }
  const onSale = discountPct !== null && discountPct > 0 && normalPrice !== null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium">{format(currency, price)}</span>
      {onSale && <s className="text-xs text-muted">{format(currency, normalPrice)}</s>}
    </span>
  );
}
