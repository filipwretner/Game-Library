import type { JSX } from 'react';
import { PlayedView } from '../features/played/PlayedView.tsx';

/**
 * App shell — composition only (spec §8.4). Tab navigation across
 * Played / Backlog / Wishlist arrives with those views (M5).
 */
export function App(): JSX.Element {
  return (
    <main>
      <h1>Game Tracker</h1>
      <PlayedView />
    </main>
  );
}
