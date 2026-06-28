import type { JSX } from 'react';
import { useHealth } from '../hooks/queries/useHealth.ts';

/**
 * Skeleton view: proves the full wire (component → hook → api → /api/health).
 * Tab navigation for Played / Backlog / Wishlist is added from Milestone 3.
 */
function describeBackendStatus(state: ReturnType<typeof useHealth>): string {
  if (state.isPending) return 'connecting…';
  if (state.isError) return 'unreachable';
  return state.data.status;
}

export function App(): JSX.Element {
  const health = useHealth();
  const backendStatus = describeBackendStatus(health);

  return (
    <main>
      <h1>Game Tracker</h1>
      <p>
        Backend: <strong data-testid="backend-status">{backendStatus}</strong>
      </p>
    </main>
  );
}
