import type { PrismaClient } from '@prisma/client';
import type { Entry, EntryStatus, EntryWithGame } from '@game-tracker/shared';
import type { CreateEntryInput, EntriesRepo, UpdateEntryInput } from '../ports.js';
import { toEntry, toEntryWithGame } from './mappers.js';

/** Prisma-backed EntriesRepo. The only place entries are read/written. */
export class PrismaEntriesRepo implements EntriesRepo {
  constructor(private readonly prisma: PrismaClient) {}

  async findByStatus(status: EntryStatus): Promise<EntryWithGame[]> {
    const rows = await this.prisma.entry.findMany({
      where: { status },
      include: { game: true },
      orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toEntryWithGame);
  }

  async findById(id: number): Promise<EntryWithGame | null> {
    const row = await this.prisma.entry.findUnique({ where: { id }, include: { game: true } });
    return row ? toEntryWithGame(row) : null;
  }

  async findByGameId(gameId: number): Promise<Entry | null> {
    const row = await this.prisma.entry.findUnique({ where: { gameId } });
    return row ? toEntry(row) : null;
  }

  async maxRank(status: EntryStatus): Promise<number | null> {
    const result = await this.prisma.entry.aggregate({
      where: { status },
      _max: { rank: true },
    });
    return result._max.rank;
  }

  async create(input: CreateEntryInput): Promise<Entry> {
    const row = await this.prisma.entry.create({
      data: {
        gameId: input.gameId,
        status: input.status,
        rank: input.rank,
        ownedPlatform: input.ownedPlatform,
        dateCompleted: input.dateCompleted ? new Date(input.dateCompleted) : null,
        notes: input.notes,
      },
    });
    return toEntry(row);
  }

  async update(id: number, patch: UpdateEntryInput): Promise<Entry> {
    const row = await this.prisma.entry.update({
      where: { id },
      data: {
        ...patch,
        dateCompleted: mapOptionalDate(patch.dateCompleted),
        priceUpdatedAt: mapOptionalDate(patch.priceUpdatedAt),
      },
    });
    return toEntry(row);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.entry.delete({ where: { id } });
  }

  async setRanks(rankings: ReadonlyArray<{ id: number; rank: number }>): Promise<void> {
    await this.prisma.$transaction(
      rankings.map((r) =>
        this.prisma.entry.update({ where: { id: r.id }, data: { rank: r.rank } }),
      ),
    );
  }
}

/**
 * `undefined` → leave column untouched; explicit `null` → clear it; ISO string → Date.
 * Keeps PATCH partial-update semantics for date columns.
 */
function mapOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(value);
}
