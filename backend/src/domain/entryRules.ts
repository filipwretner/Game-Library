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

/**
 * Status-specific fields to reset when an entry transitions to `status`. The new
 * `rank` is assigned by the service (it needs the DB), so it's not set here. Every
 * list is now ordered, so `rank` is never cleared.
 */
export function resetFieldsForStatus(status: EntryStatus): Partial<Entry> {
  switch (status) {
    case 'PLAYED':
      return { ...CLEARED_PRICE_FIELDS };
    case 'BACKLOG':
      return { ...CLEARED_PRICE_FIELDS, dateCompleted: null };
    case 'WISHLIST':
      return { dateCompleted: null, ownedPlatform: null };
  }
}
