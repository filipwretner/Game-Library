import type { JSX, ReactNode } from 'react';

interface ListHeaderProps {
  title: string;
  /** Right-aligned summary, e.g. a count or total. */
  aside?: ReactNode;
}

/** Shared list heading: title on the left, an optional summary on the right. */
export function ListHeader({ title, aside }: Readonly<ListHeaderProps>): JSX.Element {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {aside}
    </div>
  );
}
