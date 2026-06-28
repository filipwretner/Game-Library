import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { WishlistView } from './WishlistView.tsx';
import { createQueryClient } from '../../app/queryClient.ts';
import { makeEntry } from '../../test/fixtures.ts';

const IGDB_PS5 = 167;

const entriesMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
const gamesMock = vi.hoisted(() => ({ search: vi.fn() }));
const pricesMock = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock('../../api/entriesApi.ts', () => ({ entriesApi: entriesMock }));
vi.mock('../../api/gamesApi.ts', () => ({ gamesApi: gamesMock }));
vi.mock('../../api/pricesApi.ts', () => ({ pricesApi: pricesMock }));

function renderView() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <WishlistView />
    </QueryClientProvider>,
  );
}

describe('WishlistView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gamesMock.search.mockResolvedValue([]);
    entriesMock.update.mockResolvedValue(makeEntry());
    entriesMock.remove.mockResolvedValue(undefined);
    pricesMock.fetch.mockResolvedValue(makeEntry());
  });

  it('shows the price, sale badge and total, and auto-fetches a PC price', async () => {
    const user = userEvent.setup();
    entriesMock.list.mockResolvedValue([
      makeEntry({
        status: 'WISHLIST',
        ownedPlatform: null,
        price: 6.24,
        normalPrice: 24.99,
        discountPct: 75,
        priceCurrency: 'USD',
      }),
    ]);
    renderView();

    expect(await screen.findByText('USD 6.24')).toBeInTheDocument();
    expect(screen.getByText('🔥 -75%')).toBeInTheDocument();
    expect(screen.getByText('Total: USD 6.24')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fetch price' }));
    await waitFor(() => expect(pricesMock.fetch).toHaveBeenCalledWith(7));
  });

  it('uses manual price entry for a PS5 game', async () => {
    const user = userEvent.setup();
    entriesMock.list.mockResolvedValue([
      makeEntry({ status: 'WISHLIST', ownedPlatform: null, game: { platforms: [IGDB_PS5] } }),
    ]);
    renderView();

    const input = await screen.findByLabelText('Price');
    await user.type(input, '59.99');
    await user.click(screen.getByRole('button', { name: 'Save price' }));

    await waitFor(() =>
      expect(entriesMock.update).toHaveBeenCalledWith(7, { price: 59.99, priceCurrency: 'USD' }),
    );
  });
});
