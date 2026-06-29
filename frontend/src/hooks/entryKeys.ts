import type { EntryStatus } from '../types/index.ts';

/** Single source of truth for core-entry TanStack Query keys. */
export const entryKeys = {
  all: ['entries'] as const,
  list: (status: EntryStatus) => ['entries', status] as const,
};
