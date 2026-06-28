import { describe, expect, it } from 'vitest';
import { recomputeRanks } from './ranking.js';

describe('recomputeRanks', () => {
  it('produces a gap-free 1..n ranking in order', () => {
    expect(recomputeRanks([30, 10, 20])).toEqual([
      { id: 30, rank: 1 },
      { id: 10, rank: 2 },
      { id: 20, rank: 3 },
    ]);
  });

  it('returns an empty list for no ids', () => {
    expect(recomputeRanks([])).toEqual([]);
  });
});
