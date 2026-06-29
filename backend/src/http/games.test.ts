import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { SearchService } from '../services/searchService.js';
import { EntryService } from '../services/entryService.js';
import { CustomListService } from '../services/customListService.js';
import { GameCatalog } from '../services/gameCatalog.js';
import {
  FakePriceProvider,
  InMemoryCustomListsRepo,
  InMemoryEntriesRepo,
  InMemoryGamesRepo,
} from '../test/fakes.js';
import type { MetadataProvider, MetadataSearchResult } from '../integrations/ports.js';

function appWith(metadata: MetadataProvider) {
  const games = new InMemoryGamesRepo();
  const entries = new InMemoryEntriesRepo(games);
  const catalog = new GameCatalog(games, metadata);
  return createApp({
    searchService: new SearchService(metadata),
    entryService: new EntryService(entries, catalog, new FakePriceProvider()),
    customListService: new CustomListService(new InMemoryCustomListsRepo(games), catalog),
  });
}

describe('GET /api/games/search', () => {
  it('returns provider results for a valid query', async () => {
    const result: MetadataSearchResult = {
      igdbId: 1,
      title: 'Hades',
      coverUrl: null,
      platforms: [6],
      releaseDate: null,
    };
    const metadata: MetadataProvider = {
      search: vi.fn().mockResolvedValue([result]),
      getByIgdbId: vi.fn(),
    };

    const res = await request(appWith(metadata)).get('/api/games/search?q=hades');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([result]);
    expect(metadata.search).toHaveBeenCalledWith('hades');
  });

  it('rejects a missing query with 400', async () => {
    const metadata: MetadataProvider = { search: vi.fn(), getByIgdbId: vi.fn() };
    const res = await request(appWith(metadata)).get('/api/games/search');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(metadata.search).not.toHaveBeenCalled();
  });

  it('maps an upstream failure to 502', async () => {
    const metadata: MetadataProvider = {
      search: vi
        .fn()
        .mockRejectedValue(new (await import('../domain/errors.js')).BadGatewayError()),
      getByIgdbId: vi.fn(),
    };
    const res = await request(appWith(metadata)).get('/api/games/search?q=x');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('BAD_GATEWAY');
  });
});
