import type { CSSProperties, JSX } from 'react';
import type { useSortable } from '@dnd-kit/sortable';
import type { EntryWithGame } from '../types/index.ts';
import { PlatformBadge } from './PlatformBadge.tsx';
import { Button } from './Button.tsx';

/** Drag bindings supplied by the sortable list. Optional so the row renders standalone. */
export type SortableBindings = Pick<
  ReturnType<typeof useSortable>,
  'attributes' | 'listeners' | 'setNodeRef'
> & { style: CSSProperties };

interface RankRowProps {
  entry: EntryWithGame;
  onDelete: (id: number) => void;
  sortable?: SortableBindings;
}

/**
 * One row in the ranked Played list. Presentational: renders the entry, exposes
 * a drag handle, and emits onDelete. The drag *logic* (useSortable, DndContext)
 * lives in RankList — this row only applies the bindings it is handed.
 */
export function RankRow({ entry, onDelete, sortable }: Readonly<RankRowProps>): JSX.Element {
  const { game } = entry;
  return (
    <li ref={sortable?.setNodeRef} style={sortable?.style} className="rank-row">
      {sortable && (
        <Button
          className="drag-handle"
          aria-label={`Reorder ${game.title}`}
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ⠿
        </Button>
      )}
      <span className="rank">{entry.rank}</span>
      {game.coverUrl ? (
        <img src={game.coverUrl} alt={`${game.title} cover`} width={60} />
      ) : (
        <span className="no-cover">No cover</span>
      )}
      <span className="title">{game.title}</span>
      <PlatformBadge platforms={game.platforms} />
      <Button aria-label={`Remove ${game.title}`} onClick={() => onDelete(entry.id)}>
        Remove
      </Button>
    </li>
  );
}
