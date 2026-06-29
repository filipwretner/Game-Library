import type { JSX } from 'react';
import { Button } from './Button.tsx';
import { cn } from '../lib/cn.ts';

export type TabKey = 'PLAYED' | 'BACKLOG' | 'WISHLIST' | 'LISTS';

const TAB_LABELS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'PLAYED', label: 'Played' },
  { key: 'BACKLOG', label: 'Backlog' },
  { key: 'WISHLIST', label: 'Wishlist' },
  { key: 'LISTS', label: 'Lists' },
];

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/** Presentational tab bar. Holds no state — the parent owns the active tab. */
export function Tabs({ active, onChange }: Readonly<TabsProps>): JSX.Element {
  return (
    <nav className="flex gap-1 border-b border-border" role="tablist">
      {TAB_LABELS.map(({ key, label }) => (
        <Button
          key={key}
          role="tab"
          aria-selected={key === active}
          onClick={() => onChange(key)}
          className={cn(
            'rounded-none border-0 border-b-2 bg-transparent px-4 py-2 hover:bg-transparent',
            key === active
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text',
          )}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}
