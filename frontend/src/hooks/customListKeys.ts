/** Single source of truth for custom-list TanStack Query keys. */
export const customListKeys = {
  all: ['custom-lists'] as const,
  list: (id: number) => ['custom-list', id] as const,
  entries: (id: number) => ['custom-list', id, 'entries'] as const,
};
