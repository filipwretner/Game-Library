import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { EntryWithGame, GameSearchResult } from '../../types/index.ts';
import { PlayedView } from './PlayedView.tsx';
import { createQueryClient } from '../../app/queryClient.ts';

const playedEntry = vi.hoisted((): EntryWithGame => ({
  id: 7,
  gameId: 1,
  status: 'PLAYED',
  rank: 1,
  ownedPlatform: 'PC',
  price: null,
  normalPrice: null,
  discountPct: null,
  priceCurrency: null,
  priceStore: null,
  priceUpdatedAt: null,
  dateCompleted: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  game: {
    id: 1,
    igdbId: 100,
    title: 'Hades',
    coverUrl: null,
    summary: null,
    releaseDate: null,
    platforms: [6],
    igdbRating: null,
    cachedAt: '2026-01-01T00:00:00.000Z',
  },
}));

const searchHit = vi.hoisted((): GameSearchResult => ({
  igdbId: 100,
  title: 'Hades',
  coverUrl: null,
  platforms: [6],
}));

const entriesMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));
const gamesMock = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock('../../api/entriesApi.ts', () => ({ entriesApi: entriesMock }));
vi.mock('../../api/gamesApi.ts', () => ({ gamesApi: gamesMock }));

function renderView() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <PlayedView />
    </QueryClientProvider>,
  );
}

describe('PlayedView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entriesMock.list.mockResolvedValue([]);
    gamesMock.search.mockResolvedValue([]);
    entriesMock.create.mockResolvedValue(playedEntry);
    entriesMock.remove.mockResolvedValue(undefined);
  });

  it('renders the ranked list and deletes a row', async () => {
    const user = userEvent.setup();
    entriesMock.list.mockResolvedValue([playedEntry]);
    renderView();

    expect(await screen.findByText('Hades')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Hades' }));
    await waitFor(() => expect(entriesMock.remove).toHaveBeenCalledWith(7));
  });

  it('adds a searched game to the Played list', async () => {
    const user = userEvent.setup();
    gamesMock.search.mockResolvedValue([searchHit]);
    renderView();

    await user.type(screen.getByLabelText('Search for a game'), 'hades');
    await user.click(await screen.findByRole('button', { name: /Hades/ }));

    await waitFor(() =>
      expect(entriesMock.create).toHaveBeenCalledWith({ igdbId: 100, status: 'PLAYED' }),
    );
  });
});
