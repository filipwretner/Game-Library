import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { WishlistView } from './WishlistView.tsx';
import { createQueryClient } from '../../app/queryClient.ts';
import { makeEntry } from '../../test/fixtures.ts';

const entriesMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
const gamesMock = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock('../../api/entriesApi.ts', () => ({ entriesApi: entriesMock }));
vi.mock('../../api/gamesApi.ts', () => ({ gamesApi: gamesMock }));

const wishlistEntry = makeEntry({ status: 'WISHLIST', ownedPlatform: null, price: null });

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
    entriesMock.list.mockResolvedValue([wishlistEntry]);
    gamesMock.search.mockResolvedValue([]);
    entriesMock.update.mockResolvedValue(wishlistEntry);
    entriesMock.remove.mockResolvedValue(undefined);
  });

  it('saves a manually entered USD price', async () => {
    const user = userEvent.setup();
    renderView();

    const input = await screen.findByLabelText('Price');
    await user.type(input, '19.99');
    await user.click(screen.getByRole('button', { name: 'Save price' }));

    await waitFor(() =>
      expect(entriesMock.update).toHaveBeenCalledWith(7, { price: 19.99, priceCurrency: 'USD' }),
    );
  });

  it('moves a wishlist game to the backlog', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole('button', { name: 'To Backlog' }));

    await waitFor(() =>
      expect(entriesMock.update).toHaveBeenCalledWith(7, {
        status: 'BACKLOG',
        dateCompleted: undefined,
      }),
    );
  });
});
