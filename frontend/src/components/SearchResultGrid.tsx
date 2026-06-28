import type { JSX } from 'react';
import type { GameSearchResult } from '@game-tracker/shared';
import { PlatformBadge } from './PlatformBadge.tsx';
import { Button } from './Button.tsx';

interface SearchResultGridProps {
  results: GameSearchResult[];
  onSelect: (game: GameSearchResult) => void;
}

/**
 * Presentational grid of search candidates. Holds no fetching/logic — it emits
 * onSelect and the parent feature wires it to a mutation (spec §8.1).
 */
export function SearchResultGrid({
  results,
  onSelect,
}: Readonly<SearchResultGridProps>): JSX.Element {
  return (
    <ul className="search-result-grid">
      {results.map((game) => (
        <li key={game.igdbId}>
          <Button onClick={() => onSelect(game)}>
            {game.coverUrl ? (
              <img src={game.coverUrl} alt={`${game.title} cover`} width={90} />
            ) : (
              <span className="no-cover">No cover</span>
            )}
            <span className="title">{game.title}</span>
            <PlatformBadge platforms={game.platforms} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
