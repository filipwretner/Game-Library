import type { JSX } from 'react';
import { preferredPlatform } from '@game-tracker/shared';

interface PlatformBadgeProps {
  platforms: number[];
}

/**
 * Presentational badge for a game's active platform. The PC-vs-PS5 rule comes
 * from the shared domain (spec §6) — never re-implemented here.
 */
export function PlatformBadge({ platforms }: Readonly<PlatformBadgeProps>): JSX.Element {
  const platform = preferredPlatform(platforms);
  const label = platform ?? 'N/A';
  return (
    <span className="platform-badge" data-platform={platform ?? 'none'}>
      {label}
    </span>
  );
}
