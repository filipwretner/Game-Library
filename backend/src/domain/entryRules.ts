import type { Entry, EntryStatus } from '@game-tracker/shared';

/**
 * Pure rules for entry list membership (spec §5). When a game moves between
 * lists, fields that belong to the old list are cleared. No I/O — the rank value
 * for a new PLAYED entry needs the DB, so the service assigns that separately.
 */

const CLEARED_PRICE_FIELDS = {
  price: null,
  normalPrice: null,
  discountPct: null,
  priceCurrency: null,
  priceStore: null,
  priceUpdatedAt: null,
} as const satisfies Partial<Entry>;

/** Status-specific fields to reset when an entry transitions to `status`. */
export function resetFieldsForStatus(status: EntryStatus): Partial<Entry> {
  switch (status) {
    case 'PLAYED':
      return { ...CLEARED_PRICE_FIELDS, rank: null };
    case 'BACKLOG':
      return { ...CLEARED_PRICE_FIELDS, rank: null, dateCompleted: null };
    case 'WISHLIST':
      return { rank: null, dateCompleted: null, ownedPlatform: null };
  }
}
