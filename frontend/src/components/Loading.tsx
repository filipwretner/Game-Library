import type { JSX } from 'react';

interface LoadingProps {
  label?: string;
}

/** The single source of truth for a loading indicator. */
export function Loading({ label = 'Loading…' }: Readonly<LoadingProps>): JSX.Element {
  return <p className="text-sm text-muted">{label}</p>;
}
