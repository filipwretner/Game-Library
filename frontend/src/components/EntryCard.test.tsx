import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryCard } from './EntryCard.tsx';
import { makeEntry } from '../test/fixtures.ts';

describe('EntryCard', () => {
  it('renders title with release year, rank, platform, actions and emits onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const entry = makeEntry({
      status: 'PLAYED',
      rank: 1,
      game: { title: 'Hades', releaseDate: '2020-09-17T00:00:00.000Z' },
    });
    render(
      <EntryCard entry={entry} onDelete={onDelete} actions={<button type="button">Move</button>} />,
    );

    expect(screen.getByText('Hades')).toBeInTheDocument();
    expect(screen.getByText('(2020)')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Hades' }));
    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it('omits the year when the release date is unknown', () => {
    render(<EntryCard entry={makeEntry({ game: { releaseDate: null } })} onDelete={vi.fn()} />);
    expect(screen.queryByText(/\(\d{4}\)/)).not.toBeInTheDocument();
  });
});
