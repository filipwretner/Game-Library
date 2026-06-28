/**
 * Platform prioritisation (spec §6): PC always wins; fall back to PS5; otherwise none.
 * Pure, I/O-free — the single home for this rule, imported by both backend and frontend.
 */

export type Platform = 'PC' | 'PS5';

/** IGDB platform ids — named constants, never inline literals (spec §12.3). */
export const IGDB_PC = 6;
export const IGDB_PS5 = 167;

export function preferredPlatform(platformIds: readonly number[]): Platform | null {
  if (platformIds.includes(IGDB_PC)) return 'PC';
  if (platformIds.includes(IGDB_PS5)) return 'PS5';
  return null;
}
