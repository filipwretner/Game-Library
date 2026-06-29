import { describe, expect, it } from 'vitest';
import { releaseYear } from './date.js';

describe('releaseYear', () => {
  it('extracts the year from an ISO date', () => {
    expect(releaseYear('2015-06-23T00:00:00.000Z')).toBe(2015);
  });

  it('returns null for a null or invalid date', () => {
    expect(releaseYear(null)).toBeNull();
    expect(releaseYear('not-a-date')).toBeNull();
  });
});
