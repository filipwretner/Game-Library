import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EntryWithGame } from '../types/index.ts';
import { RankRow } from './RankRow.tsx';

const entry: EntryWithGame = {
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
};

describe('RankRow', () => {
  it('renders rank, title and platform, and emits onDelete with the entry id', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<RankRow entry={entry} onDelete={onDelete} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Hades')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Hades' }));
    expect(onDelete).toHaveBeenCalledWith(7);
  });
});
