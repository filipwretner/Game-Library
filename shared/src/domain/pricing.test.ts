import { describe, expect, it } from 'vitest';
import { wishlistTotal } from './pricing.js';

describe('wishlistTotal', () => {
  it('sums set prices without floating-point drift', () => {
    expect(wishlistTotal([19.99, 6.24, 0.1])).toBe(26.33);
  });

  it('treats null prices as zero', () => {
    expect(wishlistTotal([19.99, null, 10])).toBe(29.99);
  });

  it('returns 0 for an empty wishlist', () => {
    expect(wishlistTotal([])).toBe(0);
  });
});
