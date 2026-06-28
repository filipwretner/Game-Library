import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { BacklogView } from './BacklogView.tsx';
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

const backlogEntry = makeEntry({ status: 'BACKLOG' });

function renderView() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <BacklogView />
    </QueryClientProvider>,
  );
}

describe('BacklogView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entriesMock.list.mockResolvedValue([backlogEntry]);
    gamesMock.search.mockResolvedValue([]);
    entriesMock.update.mockResolvedValue(backlogEntry);
    entriesMock.remove.mockResolvedValue(undefined);
  });

  it('marks a backlog game completed (moves it to PLAYED with a date)', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole('button', { name: 'Mark completed' }));

    await waitFor(() =>
      expect(entriesMock.update).toHaveBeenCalledWith(7, {
        status: 'PLAYED',
        dateCompleted: expect.any(String),
      }),
    );
  });

  it('moves a backlog game to the wishlist', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole('button', { name: 'To Wishlist' }));

    await waitFor(() =>
      expect(entriesMock.update).toHaveBeenCalledWith(7, {
        status: 'WISHLIST',
        dateCompleted: undefined,
      }),
    );
  });
});
