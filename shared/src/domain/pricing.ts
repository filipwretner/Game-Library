/**
 * Pure pricing helpers shared by both sides (spec §8.3). Currency is pinned to
 * USD, so the wishlist total is a plain sum — no conversion.
 */

const CENTS_PER_UNIT = 100;

/** Sum the set prices on a wishlist; null prices (not yet fetched/entered) count as 0. */
export function wishlistTotal(prices: ReadonlyArray<number | null>): number {
  const cents = prices.reduce<number>(
    (sum, price) => sum + Math.round((price ?? 0) * CENTS_PER_UNIT),
    0,
  );
  return cents / CENTS_PER_UNIT;
}
