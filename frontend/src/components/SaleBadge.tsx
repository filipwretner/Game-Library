import type { JSX } from 'react';

interface SaleBadgeProps {
  discountPct: number | null;
}

/** Presentational "on sale" badge — renders only when there is a discount (spec §8.5). */
export function SaleBadge({ discountPct }: Readonly<SaleBadgeProps>): JSX.Element | null {
  if (discountPct === null || discountPct <= 0) return null;
  return <span className="sale-badge">🔥 -{discountPct}%</span>;
}
