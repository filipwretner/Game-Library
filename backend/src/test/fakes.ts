import type { Entry, EntryStatus, EntryWithGame, Game, GameMetadata } from '@game-tracker/shared';
import type {
  CreateEntryInput,
  EntriesRepo,
  GamesRepo,
  UpdateEntryInput,
} from '../repositories/ports.js';
import type { MetadataProvider, MetadataSearchResult } from '../integrations/ports.js';
import type { AppContainer } from '../container.js';
import { SearchService } from '../services/searchService.js';
import { EntryService } from '../services/entryService.js';

/**
 * In-memory fakes for the ports (spec §11.3). Let services and HTTP routes be
 * tested end-to-end with real service logic but no DB or network.
 */

export class InMemoryGamesRepo implements GamesRepo {
  readonly byId = new Map<number, Game>();
  private readonly byIgdb = new Map<number, Game>();
  private seq = 0;

  upsertByIgdbId(metadata: GameMetadata): Promise<Game> {
    const existing = this.byIgdb.get(metadata.igdbId);
    const id = existing?.id ?? ++this.seq;
    const game: Game = { id, cachedAt: new Date().toISOString(), ...metadata };
    this.byId.set(id, game);
    this.byIgdb.set(metadata.igdbId, game);
    return Promise.resolve(game);
  }

  findByIgdbId(igdbId: number): Promise<Game | null> {
    return Promise.resolve(this.byIgdb.get(igdbId) ?? null);
  }
}

export class InMemoryEntriesRepo implements EntriesRepo {
  readonly rows: Entry[] = [];
  private seq = 0;

  constructor(private readonly games: InMemoryGamesRepo) {}

  findByStatus(status: EntryStatus): Promise<EntryWithGame[]> {
    const list = this.rows
      .filter((e) => e.status === status)
      .sort(compareEntries)
      .map((e) => this.join(e));
    return Promise.resolve(list);
  }

  findById(id: number): Promise<EntryWithGame | null> {
    const entry = this.rows.find((r) => r.id === id);
    return Promise.resolve(entry ? this.join(entry) : null);
  }

  findByGameId(gameId: number): Promise<Entry | null> {
    return Promise.resolve(this.rows.find((r) => r.gameId === gameId) ?? null);
  }

  maxRank(status: EntryStatus): Promise<number | null> {
    const ranks = this.rows
      .filter((r) => r.status === status && r.rank !== null)
      .map((r) => r.rank as number);
    return Promise.resolve(ranks.length ? Math.max(...ranks) : null);
  }

  create(input: CreateEntryInput): Promise<Entry> {
    const entry: Entry = {
      id: ++this.seq,
      gameId: input.gameId,
      status: input.status,
      rank: input.rank,
      ownedPlatform: input.ownedPlatform,
      price: null,
      normalPrice: null,
      discountPct: null,
      priceCurrency: null,
      priceStore: null,
      priceUpdatedAt: null,
      dateCompleted: input.dateCompleted,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    this.rows.push(entry);
    return Promise.resolve(entry);
  }

  update(id: number, patch: UpdateEntryInput): Promise<Entry> {
    const entry = this.rows.find((r) => r.id === id);
    if (!entry) throw new Error(`entry ${id} not found`);
    Object.assign(entry, patch);
    return Promise.resolve(entry);
  }

  delete(id: number): Promise<void> {
    const index = this.rows.findIndex((r) => r.id === id);
    if (index >= 0) this.rows.splice(index, 1);
    return Promise.resolve();
  }

  private join(entry: Entry): EntryWithGame {
    const game = this.games.byId.get(entry.gameId);
    if (!game) throw new Error(`game ${entry.gameId} missing for entry ${entry.id}`);
    return { ...entry, game };
  }
}

export class FakeMetadataProvider implements MetadataProvider {
  constructor(
    private readonly metadata = new Map<number, GameMetadata>(),
    private readonly results: MetadataSearchResult[] = [],
  ) {}

  search(): Promise<MetadataSearchResult[]> {
    return Promise.resolve(this.results);
  }

  getByIgdbId(igdbId: number): Promise<GameMetadata | null> {
    return Promise.resolve(this.metadata.get(igdbId) ?? null);
  }
}

export interface TestHarness {
  container: AppContainer;
  games: InMemoryGamesRepo;
  entries: InMemoryEntriesRepo;
}

/** Build an AppContainer backed by in-memory fakes, seeded with known metadata. */
export function buildTestHarness(seed: GameMetadata[] = []): TestHarness {
  const metadata = new Map(seed.map((m) => [m.igdbId, m]));
  const provider = new FakeMetadataProvider(metadata);
  const games = new InMemoryGamesRepo();
  const entries = new InMemoryEntriesRepo(games);

  const container: AppContainer = {
    searchService: new SearchService(provider),
    entryService: new EntryService(entries, games, provider),
  };
  return { container, games, entries };
}

function compareEntries(a: Entry, b: Entry): number {
  const ra = a.rank ?? Number.POSITIVE_INFINITY;
  const rb = b.rank ?? Number.POSITIVE_INFINITY;
  return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
}
