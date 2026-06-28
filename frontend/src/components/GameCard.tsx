import type { JSX, ReactNode } from 'react';
import type { EntryWithGame } from '../types/index.ts';
import { PlatformBadge } from './PlatformBadge.tsx';

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
    <li className="game-card">
      {game.coverUrl ? (
        <img src={game.coverUrl} alt={`${game.title} cover`} width={80} />
      ) : (
        <span className="no-cover">No cover</span>
      )}
      <span className="title">{game.title}</span>
      <PlatformBadge platforms={game.platforms} />
      <div className="card-actions">{children}</div>
      <button type="button" aria-label={`Remove ${game.title}`} onClick={() => onDelete(entry.id)}>
        Remove
      </button>
    </li>
  );
}
