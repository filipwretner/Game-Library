import type { CSSProperties, JSX, ReactNode } from 'react';
import type { useSortable } from '@dnd-kit/sortable';
import { releaseYear } from '@game-tracker/shared';
import type { Game } from '../types/index.ts';
import { PlatformBadge } from './PlatformBadge.tsx';
import { Button } from './Button.tsx';

/** Minimal shape the card needs — satisfied by both core entries and custom-list entries. */
export interface CardEntry {
  id: number;
  rank: number | null;
  game: Game;
}

/** Drag bindings supplied by the sortable list. Optional so the card renders standalone. */
export type SortableBindings = Pick<
  ReturnType<typeof useSortable>,
  'attributes' | 'listeners' | 'setNodeRef'
> & { style: CSSProperties };

interface EntryCardProps {
  entry: CardEntry;
  onDelete: (id: number) => void;
  /** View-specific bottom-row content (price, move buttons). */
  actions?: ReactNode;
  sortable?: SortableBindings;
}

/**
 * The single card used by every list. Two rows so long titles never push the
 * buttons around: top row = drag handle, rank, cover, title + release year,
 * platform; bottom row = right-aligned actions + Remove. Presentational — the
 * drag *logic* lives in SortableList.
 */
export function EntryCard({
  entry,
  onDelete,
  actions,
  sortable,
}: Readonly<EntryCardProps>): JSX.Element {
  const { game } = entry;
  const year = releaseYear(game.releaseDate);
  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className="rounded-lg border border-border bg-surface p-3"
    >
      <div className="flex items-center gap-3">
        {sortable && (
          <Button
            className="cursor-grab border-0 bg-transparent px-1 text-muted hover:bg-transparent hover:text-text"
            aria-label={`Reorder ${game.title}`}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            ⠿
          </Button>
        )}
        {entry.rank !== null && (
          <span className="w-6 text-center text-sm font-bold text-muted">{entry.rank}</span>
        )}
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={`${game.title} cover`}
            width={48}
            className="h-12 w-auto rounded"
          />
        ) : (
          <span className="text-xs text-muted">No cover</span>
        )}
        <span className="flex-1 font-medium">
          {game.title}
          {year !== null && <span className="ml-1 font-normal text-muted">({year})</span>}
        </span>
        <PlatformBadge platforms={game.platforms} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        {actions}
        <Button aria-label={`Remove ${game.title}`} onClick={() => onDelete(entry.id)}>
          Remove
        </Button>
      </div>
    </li>
  );
}
