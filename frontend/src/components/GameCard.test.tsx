import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameCard } from './GameCard.tsx';
import { makeEntry } from '../test/fixtures.ts';

describe('GameCard', () => {
  it('renders the game, its actions slot, and emits onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <GameCard entry={makeEntry()} onDelete={onDelete}>
        <button type="button">Move</button>
      </GameCard>,
    );

    expect(screen.getByText('Hades')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Hades' }));
    expect(onDelete).toHaveBeenCalledWith(7);
  });
});
