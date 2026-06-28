import { describe, expect, it } from 'vitest';
import { IGDB_PC, IGDB_PS5, preferredPlatform } from './platform.js';

describe('preferredPlatform', () => {
  it('returns PC when PC is available', () => {
    expect(preferredPlatform([IGDB_PC])).toBe('PC');
  });

  it('returns PS5 when only PS5 is available', () => {
    expect(preferredPlatform([IGDB_PS5])).toBe('PS5');
  });

  it('prefers PC when both are available', () => {
    expect(preferredPlatform([IGDB_PS5, IGDB_PC])).toBe('PC');
  });

  it('returns null when neither is available', () => {
    expect(preferredPlatform([3, 48])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(preferredPlatform([])).toBeNull();
  });
});
