/**
 * UI-facing types — re-exported from shared/ so the frontend imports from one
 * place and never redeclares cross-stack shapes (spec §8.3).
 */
export type {
  CustomList,
  CustomListEntry,
  CustomListEntryWithGame,
  Entry,
  EntryStatus,
  EntryWithGame,
  Game,
  GameSearchResult,
  Platform,
} from '@game-tracker/shared';
