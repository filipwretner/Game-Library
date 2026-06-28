import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { GameSearchResult } from '@game-tracker/shared';
import { AddGameModal } from './AddGameModal.tsx';
import { createQueryClient } from '../../app/queryClient.ts';

// Hoisted so it is initialised before the hoisted vi.mock factory runs.
const hades = vi.hoisted<GameSearchResult>(() => ({
  igdbId: 1,
  title: 'Hades',
  coverUrl: null,
  platforms: [6],
}));

// Fake the api layer at its boundary (spec §11.4) — no real network.
vi.mock('../../api/gamesApi.ts', () => ({
  gamesApi: { search: vi.fn().mockResolvedValue([hades]) },
}));

function renderModal(onSelect: (g: GameSearchResult) => void) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AddGameModal onSelect={onSelect} />
    </QueryClientProvider>,
  );
}

describe('AddGameModal', () => {
  it('searches as the user types and bubbles the picked game', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderModal(onSelect);

    await user.type(screen.getByLabelText('Search for a game'), 'hades');

    const result = await screen.findByRole('button', { name: /Hades/ });
    await user.click(result);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(hades));
  });
});
