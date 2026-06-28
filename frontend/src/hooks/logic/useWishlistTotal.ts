import { useMemo } from 'react';
import { wishlistTotal } from '@game-tracker/shared';
import type { EntryWithGame } from '../../types/index.ts';

/**
 * Header total for the wishlist (spec §8.5). Derived from cached entries via the
 * shared pure rule — memoised, not recomputed inline in JSX.
 */
export function useWishlistTotal(entries: EntryWithGame[] | undefined): number {
  return useMemo(() => wishlistTotal((entries ?? []).map((e) => e.price)), [entries]);
}
