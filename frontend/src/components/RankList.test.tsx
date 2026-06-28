import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EntryWithGame } from '../types/index.ts';
import { RankList } from './RankList.tsx';

function entry(id: number, rank: number, title: string): EntryWithGame {
  return {
    id,
    gameId: id,
    status: 'PLAYED',
    rank,
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
      id,
      igdbId: id,
      title,
      coverUrl: null,
      summary: null,
      releaseDate: null,
      platforms: [6],
      igdbRating: null,
      cachedAt: '2026-01-01T00:00:00.000Z',
    },
  };
}

describe('RankList', () => {
  it('renders rows in order with a drag handle each', () => {
    const entries = [entry(1, 1, 'Hades'), entry(2, 2, 'Celeste')];
    render(<RankList entries={entries} onReorder={vi.fn()} onDelete={vi.fn()} />);

    const titles = screen.getAllByText(/Hades|Celeste/).map((el) => el.textContent);
    expect(titles).toEqual(['Hades', 'Celeste']);
    expect(screen.getByRole('button', { name: 'Reorder Hades' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Celeste' })).toBeInTheDocument();
  });
});
