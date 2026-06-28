import { describe, expect, it } from 'vitest';
import { pickBestDeal, type DealCandidate } from './pricing.js';

function deal(salePrice: number, storeId = '1'): DealCandidate {
  return { salePrice, normalPrice: 24.99, savings: 50, storeId, dealId: `d-${storeId}` };
}

describe('pickBestDeal', () => {
  it('selects the lowest sale price', () => {
    const best = pickBestDeal([deal(9.99, '1'), deal(6.24, '2'), deal(12, '3')]);
    expect(best?.salePrice).toBe(6.24);
    expect(best?.storeId).toBe('2');
  });

  it('returns null when there are no deals', () => {
    expect(pickBestDeal([])).toBeNull();
  });
});
