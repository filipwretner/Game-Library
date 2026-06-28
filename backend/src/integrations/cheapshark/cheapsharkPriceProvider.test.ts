import { describe, expect, it, vi } from 'vitest';
import { CheapsharkPriceProvider } from './cheapsharkPriceProvider.js';
import type { CheapsharkClient } from './cheapsharkClient.js';

function client(deals: unknown, stores: unknown = []): CheapsharkClient {
  return { deals: vi.fn().mockResolvedValue(deals), stores: vi.fn().mockResolvedValue(stores) };
}

const stores = [{ storeID: '1', storeName: 'Steam' }];

describe('CheapsharkPriceProvider.getBestPrice', () => {
  it('maps the cheapest deal to a PriceQuote with the store name and redirect link', async () => {
    const deals = [
      { salePrice: '9.99', normalPrice: '24.99', savings: '60.0', storeID: '1', dealID: 'abc' },
      { salePrice: '6.24', normalPrice: '24.99', savings: '75.03', storeID: '1', dealID: 'xyz' },
    ];
    const quote = await new CheapsharkPriceProvider(client(deals, stores)).getBestPrice('hades');

    expect(quote).toEqual({
      price: 6.24,
      normalPrice: 24.99,
      discountPct: 75,
      currency: 'USD',
      store: 'Steam',
      dealUrl: 'https://www.cheapshark.com/redirect?dealID=xyz',
    });
  });

  it('returns null when there are no deals', async () => {
    expect(await new CheapsharkPriceProvider(client([])).getBestPrice('nope')).toBeNull();
  });
});
