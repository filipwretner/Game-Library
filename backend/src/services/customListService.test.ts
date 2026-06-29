import { beforeEach, describe, expect, it } from 'vitest';
import type { GameMetadata } from '@game-tracker/shared';
import { buildTestHarness } from '../test/fakes.js';
import type { CustomListService } from './customListService.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js';

const gameA: GameMetadata = {
  igdbId: 1,
  title: 'Hades',
  coverUrl: null,
  summary: null,
  releaseDate: null,
  platforms: [6],
  igdbRating: null,
};
const gameB: GameMetadata = { ...gameA, igdbId: 2, title: 'Celeste' };

describe('CustomListService', () => {
  let service: CustomListService;

  beforeEach(() => {
    service = buildTestHarness([gameA, gameB]).container.customListService;
  });

  it('creates a list and lists it', async () => {
    const list = await service.createList('Top 10 of 2024');
    expect(list.title).toBe('Top 10 of 2024');
    expect(await service.listLists()).toHaveLength(1);
  });

  it('adds games with sequential ranks and reorders them', async () => {
    const list = await service.createList('Favourites');
    const a = await service.addGame(list.id, 1);
    const b = await service.addGame(list.id, 2);
    expect([a.rank, b.rank]).toEqual([1, 2]);

    const reordered = await service.reorder(list.id, [b.id, a.id]);
    expect(reordered.map((e) => [e.game.title, e.rank])).toEqual([
      ['Celeste', 1],
      ['Hades', 2],
    ]);
  });

  it('rejects adding the same game to a list twice', async () => {
    const list = await service.createList('Favourites');
    await service.addGame(list.id, 1);
    await expect(service.addGame(list.id, 1)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects an unknown IGDB id and a missing list', async () => {
    const list = await service.createList('Favourites');
    await expect(service.addGame(list.id, 999)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getEntries(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a reorder that is not the current list set', async () => {
    const list = await service.createList('Favourites');
    const a = await service.addGame(list.id, 1);
    await expect(service.reorder(list.id, [a.id, 999])).rejects.toBeInstanceOf(ValidationError);
  });

  it('removes an entry and deletes a list', async () => {
    const list = await service.createList('Favourites');
    const a = await service.addGame(list.id, 1);

    await service.removeEntry(list.id, a.id);
    expect(await service.getEntries(list.id)).toHaveLength(0);

    await service.deleteList(list.id);
    expect(await service.listLists()).toHaveLength(0);
  });
});
