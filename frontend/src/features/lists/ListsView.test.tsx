import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { CustomList, GameSearchResult } from '../../types/index.ts';
import { ListsView } from './ListsView.tsx';
import { createQueryClient } from '../../app/queryClient.ts';

const list = vi.hoisted((): CustomList => ({
  id: 5,
  title: 'Top 10 of 2024',
  createdAt: '2026-01-01T00:00:00.000Z',
}));
const searchHit = vi.hoisted((): GameSearchResult => ({
  igdbId: 100,
  title: 'Hades',
  coverUrl: null,
  platforms: [6],
  releaseDate: '2020-09-17T00:00:00.000Z',
}));

const listsMock = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  entries: vi.fn(),
  addEntry: vi.fn(),
  removeEntry: vi.fn(),
  reorder: vi.fn(),
}));
const gamesMock = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock('../../api/listsApi.ts', () => ({ listsApi: listsMock }));
vi.mock('../../api/gamesApi.ts', () => ({ gamesApi: gamesMock }));

function renderView() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ListsView />
    </QueryClientProvider>,
  );
}

describe('ListsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listsMock.list.mockResolvedValue([list]);
    listsMock.get.mockResolvedValue(list);
    listsMock.entries.mockResolvedValue([]);
    listsMock.create.mockResolvedValue(list);
    gamesMock.search.mockResolvedValue([]);
  });

  it('creates a list from the overview', async () => {
    const user = userEvent.setup();
    listsMock.list.mockResolvedValue([]);
    renderView();

    await user.click(await screen.findByRole('button', { name: 'Create List' }));
    await user.type(screen.getByLabelText('List title'), 'Favourites');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(listsMock.create).toHaveBeenCalledWith('Favourites'));
  });

  it('opens a list (showing its title) and adds a searched game', async () => {
    const user = userEvent.setup();
    gamesMock.search.mockResolvedValue([searchHit]);
    renderView();

    await user.click(await screen.findByRole('button', { name: 'Top 10 of 2024' }));
    expect(screen.getByRole('heading', { name: 'Top 10 of 2024' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search for a game'), 'hades');
    await user.click(await screen.findByRole('button', { name: /Hades/ }));

    await waitFor(() => expect(listsMock.addEntry).toHaveBeenCalledWith(5, 100));
  });
});
