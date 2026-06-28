import { useState, type JSX } from 'react';
import type { GameSearchResult } from '@game-tracker/shared';
import { useHealth } from '../hooks/queries/useHealth.ts';
import { AddGameModal } from '../features/add-game/AddGameModal.tsx';

/**
 * App shell — composition only (spec §8.4). Renders the health line and the
 * add-game search. Tab navigation + list views arrive in Milestone 3.
 */
function describeBackendStatus(state: ReturnType<typeof useHealth>): string {
  if (state.isPending) return 'connecting…';
  if (state.isError) return 'unreachable';
  return state.data.status;
}

export function App(): JSX.Element {
  const health = useHealth();
  const backendStatus = describeBackendStatus(health);
  const [picked, setPicked] = useState<GameSearchResult | null>(null);

  return (
    <main>
      <h1>Game Tracker</h1>
      <p>
        Backend: <strong data-testid="backend-status">{backendStatus}</strong>
      </p>
      <AddGameModal onSelect={setPicked} />
      {picked && <p data-testid="picked-game">Selected: {picked.title}</p>}
    </main>
  );
}
