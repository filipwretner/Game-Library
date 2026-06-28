import type { JSX } from 'react';

interface SaleBadgeProps {
  discountPct: number | null;
}

/** Presentational "on sale" badge — renders only when there is a discount (spec §8.5). */
export function SaleBadge({ discountPct }: Readonly<SaleBadgeProps>): JSX.Element | null {
  if (discountPct === null || discountPct <= 0) return null;
  return (
    <span className="rounded bg-sale/15 px-1.5 py-0.5 text-xs font-semibold text-sale">
      🔥 -{discountPct}%
    </span>
  );
}
