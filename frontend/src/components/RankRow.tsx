import type { JSX } from 'react';
import type { EntryWithGame } from '../types/index.ts';
import { PlatformBadge } from './PlatformBadge.tsx';

interface RankRowProps {
  entry: EntryWithGame;
  onDelete: (id: number) => void;
}

/**
 * One row in the ranked Played list. Presentational: renders the entry and emits
 * onDelete. Drag-to-reorder arrives in Milestone 4 (handled by the list, not the row).
 */
export function RankRow({ entry, onDelete }: Readonly<RankRowProps>): JSX.Element {
  const { game } = entry;
  return (
    <li className="rank-row">
      <span className="rank">{entry.rank}</span>
      {game.coverUrl ? (
        <img src={game.coverUrl} alt={`${game.title} cover`} width={60} />
      ) : (
        <span className="no-cover">No cover</span>
      )}
      <span className="title">{game.title}</span>
      <PlatformBadge platforms={game.platforms} />
      <button type="button" aria-label={`Remove ${game.title}`} onClick={() => onDelete(entry.id)}>
        Remove
      </button>
    </li>
  );
}
