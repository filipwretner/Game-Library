import type { CustomList, CustomListEntryWithGame } from '@game-tracker/shared';
import type { CustomListsRepo } from '../repositories/ports.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js';
import { isSameIdSet, recomputeRanks } from '../domain/ranking.js';
import type { GameCatalog } from './gameCatalog.js';

const FIRST_RANK = 1;

/**
 * Custom-list use cases (spec §7.1 layer 2): user-created lists with their own
 * ranked membership. Reuses GameCatalog for game resolution and recomputeRanks
 * for ordering — no duplicated logic with the core entries flow.
 */
export class CustomListService {
  constructor(
    private readonly lists: CustomListsRepo,
    private readonly catalog: GameCatalog,
  ) {}

  createList(title: string): Promise<CustomList> {
    // Title is already trimmed + non-empty by the Zod schema at the boundary.
    return this.lists.createList(title);
  }

  listLists(): Promise<CustomList[]> {
    return this.lists.findAllLists();
  }

  getList(id: number): Promise<CustomList> {
    return this.requireList(id);
  }

  async getEntries(listId: number): Promise<CustomListEntryWithGame[]> {
    await this.requireList(listId);
    return this.lists.findEntriesByList(listId);
  }

  async addGame(listId: number, igdbId: number): Promise<CustomListEntryWithGame> {
    await this.requireList(listId);
    const game = await this.catalog.resolveByIgdbId(igdbId);

    const existing = await this.lists.findEntryByGame(listId, game.id);
    if (existing) {
      throw new ConflictError('Game is already on this list');
    }
    const created = await this.lists.addEntry({
      listId,
      gameId: game.id,
      rank: await this.nextRank(listId),
    });
    return { ...created, game };
  }

  async reorder(listId: number, orderedEntryIds: number[]): Promise<CustomListEntryWithGame[]> {
    const entries = await this.getEntries(listId);
    if (
      !isSameIdSet(
        orderedEntryIds,
        entries.map((e) => e.id),
      )
    ) {
      throw new ValidationError('orderedEntryIds must match the current list entries');
    }
    await this.lists.setRanks(recomputeRanks(orderedEntryIds));
    return this.lists.findEntriesByList(listId);
  }

  async removeEntry(listId: number, entryId: number): Promise<void> {
    const entry = await this.lists.findEntryById(entryId);
    if (!entry || entry.listId !== listId) {
      throw new NotFoundError(`Entry ${entryId} not found on list ${listId}`);
    }
    await this.lists.deleteEntry(entryId);
  }

  async deleteList(id: number): Promise<void> {
    await this.requireList(id);
    await this.lists.deleteList(id);
  }

  private async nextRank(listId: number): Promise<number> {
    const max = await this.lists.maxRank(listId);
    return max === null ? FIRST_RANK : max + 1;
  }

  private async requireList(id: number): Promise<CustomList> {
    const list = await this.lists.findListById(id);
    if (!list) {
      throw new NotFoundError(`List ${id} not found`);
    }
    return list;
  }
}
