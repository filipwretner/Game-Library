import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortableList } from './SortableList.tsx';
import { makeEntry } from '../test/fixtures.ts';

describe('SortableList', () => {
  it('renders cards in order with a drag handle each and per-entry actions', () => {
    const entries = [
      makeEntry({ id: 1, rank: 1, game: { igdbId: 1, title: 'Hades' } }),
      makeEntry({ id: 2, rank: 2, game: { igdbId: 2, title: 'Celeste' } }),
    ];
    render(
      <SortableList
        entries={entries}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
        renderActions={(entry) => <span>act-{entry.id}</span>}
      />,
    );

    const titles = screen.getAllByText(/Hades|Celeste/).map((el) => el.textContent);
    expect(titles).toEqual(['Hades', 'Celeste']);
    expect(screen.getByRole('button', { name: 'Reorder Hades' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Celeste' })).toBeInTheDocument();
    expect(screen.getByText('act-1')).toBeInTheDocument();
  });
});
