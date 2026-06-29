import { useState, type JSX } from 'react';
import { ListsOverview } from './ListsOverview.tsx';
import { ListDetail } from './ListDetail.tsx';

/**
 * Custom lists view. With no list selected, shows the lists + create form; with
 * one selected, shows its title and the same add/rank interaction as Played.
 * The selected list id is ephemeral UI state.
 */
export function ListsView(): JSX.Element {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return selectedId === null ? (
    <ListsOverview onSelect={setSelectedId} />
  ) : (
    <ListDetail listId={selectedId} onBack={() => setSelectedId(null)} />
  );
}
