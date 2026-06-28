import type { JSX, ReactNode } from 'react';
import type { EntryWithGame } from '../types/index.ts';
import { PlatformBadge } from './PlatformBadge.tsx';
import { Button } from './Button.tsx';

interface GameCardProps {
  entry: EntryWithGame;
  onDelete: (id: number) => void;
  /** View-specific content (price, move buttons). Kept out of this component's concern. */
  children?: ReactNode;
}

/**
 * Presentational card for a Backlog/Wishlist entry. Renders cover, title and the
 * platform badge; the parent view injects list-specific actions via children.
 */
export function GameCard({ entry, onDelete, children }: Readonly<GameCardProps>): JSX.Element {
  const { game } = entry;
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
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
      <span className="font-medium">{game.title}</span>
      <PlatformBadge platforms={game.platforms} />
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
      <Button aria-label={`Remove ${game.title}`} onClick={() => onDelete(entry.id)}>
        Remove
      </Button>
    </li>
  );
}
