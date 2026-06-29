import type { JSX } from 'react';
import { releaseYear, type GameSearchResult } from '@game-tracker/shared';
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
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {results.map((game) => (
        <li key={game.igdbId}>
          <Button
            onClick={() => onSelect(game)}
            className="h-full w-full flex-col items-start gap-2 bg-surface p-2 text-left hover:bg-raised"
          >
            {game.coverUrl ? (
              <img
                src={game.coverUrl}
                alt={`${game.title} cover`}
                className="w-full rounded object-cover"
              />
            ) : (
              <span className="text-xs text-muted">No cover</span>
            )}
            <span className="text-sm font-medium">
              {game.title}
              {releaseYear(game.releaseDate) !== null && (
                <span className="ml-1 font-normal text-muted">
                  ({releaseYear(game.releaseDate)})
                </span>
              )}
            </span>
            <PlatformBadge platforms={game.platforms} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
