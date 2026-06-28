import { useState, type JSX } from 'react';
import type { GameSearchResult } from '@game-tracker/shared';
import { useGameSearch } from '../../hooks/queries/useGameSearch.ts';
import { SearchResultGrid } from '../../components/SearchResultGrid.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner } from '../../components/ErrorBanner.tsx';

interface AddGameModalProps {
  /** Called when a candidate is picked; the parent persists it via a mutation. */
  onSelect: (game: GameSearchResult) => void;
}

/**
 * Add-game search (spec §8.5). Holds only the input text; results, debounce and
 * fetching live in useGameSearch. Clears the query after a pick so the same
 * result can't be re-added by accident.
 */
export function AddGameModal({ onSelect }: Readonly<AddGameModalProps>): JSX.Element {
  const [query, setQuery] = useState('');
  const { data: results, isFetching, isError } = useGameSearch(query);

  const handleSelect = (game: GameSearchResult): void => {
    onSelect(game);
    setQuery('');
  };

  return (
    <section className="space-y-2">
      <input
        type="search"
        value={query}
        placeholder="Search for a game…"
        aria-label="Search for a game"
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      {isFetching && <Loading label="Searching…" />}
      <ErrorBanner message={isError ? 'Search failed. Try again.' : null} />
      {results && <SearchResultGrid results={results} onSelect={handleSelect} />}
    </section>
  );
}
