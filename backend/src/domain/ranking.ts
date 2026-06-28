/**
 * Ranking rules (spec §6/§7.3). Pure, I/O-free — the single home for "rank =
 * position". Used when committing a drag-and-drop reorder of the Played list.
 */

export interface RankAssignment {
  id: number;
  rank: number;
}

const FIRST_RANK = 1;

/** Map an ordered list of entry ids to a gap-free 1..n ranking. */
export function recomputeRanks(orderedIds: readonly number[]): RankAssignment[] {
  return orderedIds.map((id, index) => ({ id, rank: index + FIRST_RANK }));
}
