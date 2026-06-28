import type { JSX } from 'react';
import { preferredPlatform, type Platform } from '@game-tracker/shared';
import { cn } from '../lib/cn.ts';

interface PlatformBadgeProps {
  platforms: number[];
}

const BADGE_CLASS: Record<Platform, string> = {
  PC: 'bg-pc/15 text-pc',
  PS5: 'bg-ps5/15 text-ps5',
};

/**
 * Presentational badge for a game's active platform. The PC-vs-PS5 rule comes
 * from the shared domain (spec §6) — never re-implemented here.
 */
export function PlatformBadge({ platforms }: Readonly<PlatformBadgeProps>): JSX.Element {
  const platform = preferredPlatform(platforms);
  const label = platform ?? 'N/A';
  return (
    <span
      data-platform={platform ?? 'none'}
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold',
        platform ? BADGE_CLASS[platform] : 'bg-border text-muted',
      )}
    >
      {label}
    </span>
  );
}
