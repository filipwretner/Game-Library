import { useState, type JSX } from 'react';
import type { GameSearchResult } from '@game-tracker/shared';
import { useGameSearch } from '../../hooks/queries/useGameSearch.ts';
import { SearchResultGrid } from '../../components/SearchResultGrid.tsx';

interface AddGameModalProps {
  /** Called when a candidate is picked. Wired to useAddEntry in Milestone 3. */
  onSelect: (game: GameSearchResult) => void;
}

/**
 * Add-game search (spec §8.5). Holds only the input text; results, debounce and
 * fetching live in useGameSearch. Composition over logic.
 */
export function AddGameModal({ onSelect }: Readonly<AddGameModalProps>): JSX.Element {
  const [query, setQuery] = useState('');
  const { data: results, isFetching, isError } = useGameSearch(query);

  return (
    <section className="add-game">
      <input
        type="search"
        value={query}
        placeholder="Search for a game…"
        aria-label="Search for a game"
        onChange={(e) => setQuery(e.target.value)}
      />
      {isFetching && <p>Searching…</p>}
      {isError && <p role="alert">Search failed. Try again.</p>}
      {results && <SearchResultGrid results={results} onSelect={onSelect} />}
    </section>
  );
}
