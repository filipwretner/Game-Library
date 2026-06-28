/**
 * Best-deal selection (spec §2.2, §9). Pure — picks the lowest current sale price
 * from a set of CheapShark deals. The provider parses raw deals into this shape
 * and maps the winner onto a PriceQuote.
 */

export interface DealCandidate {
  salePrice: number;
  normalPrice: number;
  /** CheapShark "savings" percentage (e.g. 75.03). */
  savings: number;
  storeId: string;
  dealId: string;
}

/** Returns the deal with the lowest salePrice, or null when there are none. */
export function pickBestDeal(deals: readonly DealCandidate[]): DealCandidate | null {
  return deals.reduce<DealCandidate | null>((best, deal) => {
    return best === null || deal.salePrice < best.salePrice ? deal : best;
  }, null);
}
