import type {
  CustomList as PrismaCustomList,
  CustomListEntry as PrismaCustomListEntry,
  Game as PrismaGame,
} from '@prisma/client';
import type { CustomList, CustomListEntry, CustomListEntryWithGame } from '@game-tracker/shared';
import { toGame } from './mappers.js';

/** Translate custom-list Prisma rows into shared types. */

export function toCustomList(row: PrismaCustomList): CustomList {
  return { id: row.id, title: row.title, createdAt: row.createdAt.toISOString() };
}

export function toCustomListEntry(row: PrismaCustomListEntry): CustomListEntry {
  return {
    id: row.id,
    listId: row.listId,
    gameId: row.gameId,
    rank: row.rank,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCustomListEntryWithGame(
  row: PrismaCustomListEntry & { game: PrismaGame },
): CustomListEntryWithGame {
  return { ...toCustomListEntry(row), game: toGame(row.game) };
}
