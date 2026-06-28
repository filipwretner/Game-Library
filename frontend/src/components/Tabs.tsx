import type { JSX } from 'react';
import { Button } from './Button.tsx';

export type TabKey = 'PLAYED' | 'BACKLOG' | 'WISHLIST';

const TAB_LABELS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'PLAYED', label: 'Played' },
  { key: 'BACKLOG', label: 'Backlog' },
  { key: 'WISHLIST', label: 'Wishlist' },
];

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/** Presentational tab bar. Holds no state — the parent owns the active tab. */
export function Tabs({ active, onChange }: Readonly<TabsProps>): JSX.Element {
  return (
    <nav className="tabs" role="tablist">
      {TAB_LABELS.map(({ key, label }) => (
        <Button key={key} role="tab" aria-selected={key === active} onClick={() => onChange(key)}>
          {label}
        </Button>
      ))}
    </nav>
  );
}
