import { describe, expect, it, vi } from 'vitest';
import { CheapsharkPriceProvider } from './cheapsharkPriceProvider.js';
import type { CheapsharkClient } from './cheapsharkClient.js';

function client(summaries: unknown, deals: unknown, stores: unknown = []): CheapsharkClient {
  return {
    gameSummaries: vi.fn().mockResolvedValue(summaries),
    gameDeals: vi.fn().mockResolvedValue({ deals }),
    stores: vi.fn().mockResolvedValue(stores),
  };
}

const stores = [{ storeID: '1', storeName: 'Steam' }];

describe('CheapsharkPriceProvider.getBestPrice', () => {
  it('scopes deals to the top-matching game and maps the cheapest one', async () => {
    const summaries = [{ gameID: '196149' }];
    const deals = [
      { storeID: '1', dealID: 'abc', price: '9.99', retailPrice: '24.99', savings: '60.0' },
      { storeID: '1', dealID: 'xyz', price: '6.24', retailPrice: '24.99', savings: '75.03' },
    ];
    const provider = new CheapsharkPriceProvider(client(summaries, deals, stores));

    const quote = await provider.getBestPrice('hades');

    expect(quote).toEqual({
      price: 6.24,
      normalPrice: 24.99,
      discountPct: 75,
      currency: 'USD',
      store: 'Steam',
      dealUrl: 'https://www.cheapshark.com/redirect?dealID=xyz',
    });
  });

  it('returns null when no game matches the title', async () => {
    expect(await new CheapsharkPriceProvider(client([], [])).getBestPrice('nope')).toBeNull();
  });

  it('returns null when the matched game has no deals', async () => {
    const provider = new CheapsharkPriceProvider(client([{ gameID: '1' }], []));
    expect(await provider.getBestPrice('hades')).toBeNull();
  });
});
