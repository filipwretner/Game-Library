import { useState, type ComponentType, type JSX } from 'react';
import { Tabs, type TabKey } from '../components/Tabs.tsx';
import { PlayedView } from '../features/played/PlayedView.tsx';
import { BacklogView } from '../features/backlog/BacklogView.tsx';
import { WishlistView } from '../features/wishlist/WishlistView.tsx';

const VIEWS: Record<TabKey, ComponentType> = {
  PLAYED: PlayedView,
  BACKLOG: BacklogView,
  WISHLIST: WishlistView,
};

/**
 * App shell — composition only (spec §8.4). Owns the active tab (ephemeral UI
 * state) and renders the matching view; the views own their data via hooks.
 */
export function App(): JSX.Element {
  const [tab, setTab] = useState<TabKey>('PLAYED');
  const ActiveView = VIEWS[tab];

  return (
    <main>
      <h1>Game Tracker</h1>
      <Tabs active={tab} onChange={setTab} />
      <ActiveView />
    </main>
  );
}
