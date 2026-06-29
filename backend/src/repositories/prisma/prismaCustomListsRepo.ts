import type { PrismaClient } from '@prisma/client';
import type { CustomList, CustomListEntry, CustomListEntryWithGame } from '@game-tracker/shared';
import type { CustomListsRepo, RankAssignments } from '../ports.js';
import { toCustomList, toCustomListEntry, toCustomListEntryWithGame } from './customListMappers.js';

/** Prisma-backed CustomListsRepo. The only place custom lists are read/written. */
export class PrismaCustomListsRepo implements CustomListsRepo {
  constructor(private readonly prisma: PrismaClient) {}

  async createList(title: string): Promise<CustomList> {
    return toCustomList(await this.prisma.customList.create({ data: { title } }));
  }

  async findAllLists(): Promise<CustomList[]> {
    const rows = await this.prisma.customList.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toCustomList);
  }

  async findListById(id: number): Promise<CustomList | null> {
    const row = await this.prisma.customList.findUnique({ where: { id } });
    return row ? toCustomList(row) : null;
  }

  async deleteList(id: number): Promise<void> {
    await this.prisma.customList.delete({ where: { id } });
  }

  async findEntriesByList(listId: number): Promise<CustomListEntryWithGame[]> {
    const rows = await this.prisma.customListEntry.findMany({
      where: { listId },
      include: { game: true },
      orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toCustomListEntryWithGame);
  }

  async findEntryByGame(listId: number, gameId: number): Promise<CustomListEntry | null> {
    const row = await this.prisma.customListEntry.findUnique({
      where: { listId_gameId: { listId, gameId } },
    });
    return row ? toCustomListEntry(row) : null;
  }

  async maxRank(listId: number): Promise<number | null> {
    const result = await this.prisma.customListEntry.aggregate({
      where: { listId },
      _max: { rank: true },
    });
    return result._max.rank;
  }

  async addEntry(input: {
    listId: number;
    gameId: number;
    rank: number;
  }): Promise<CustomListEntry> {
    return toCustomListEntry(await this.prisma.customListEntry.create({ data: input }));
  }

  async deleteEntry(entryId: number): Promise<void> {
    await this.prisma.customListEntry.delete({ where: { id: entryId } });
  }

  async setRanks(rankings: RankAssignments): Promise<void> {
    await this.prisma.$transaction(
      rankings.map((r) =>
        this.prisma.customListEntry.update({ where: { id: r.id }, data: { rank: r.rank } }),
      ),
    );
  }
}
