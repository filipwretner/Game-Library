import type {
  CustomList,
  CustomListEntry,
  CustomListEntryWithGame,
  Entry,
  EntryStatus,
  EntryWithGame,
  Game,
  GameMetadata,
  PriceQuote,
} from '@game-tracker/shared';
import type {
  CreateEntryInput,
  CustomListsRepo,
  EntriesRepo,
  GamesRepo,
  RankAssignments,
  UpdateEntryInput,
} from '../repositories/ports.js';
import type {
  MetadataProvider,
  MetadataSearchResult,
  PriceProvider,
} from '../integrations/ports.js';
import type { AppContainer } from '../container.js';
import { SearchService } from '../services/searchService.js';
import { EntryService } from '../services/entryService.js';
import { CustomListService } from '../services/customListService.js';
import { GameCatalog } from '../services/gameCatalog.js';

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

  setRanks(rankings: ReadonlyArray<{ id: number; rank: number }>): Promise<void> {
    for (const { id, rank } of rankings) {
      const entry = this.rows.find((r) => r.id === id);
      if (entry) entry.rank = rank;
    }
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

export class FakePriceProvider implements PriceProvider {
  constructor(private readonly quote: PriceQuote | null = null) {}

  getBestPrice(): Promise<PriceQuote | null> {
    return Promise.resolve(this.quote);
  }
}

export class InMemoryCustomListsRepo implements CustomListsRepo {
  private readonly lists: CustomList[] = [];
  private readonly entries: CustomListEntry[] = [];
  private listSeq = 0;
  private entrySeq = 0;

  constructor(private readonly games: InMemoryGamesRepo) {}

  createList(title: string): Promise<CustomList> {
    const list: CustomList = { id: ++this.listSeq, title, createdAt: new Date().toISOString() };
    this.lists.push(list);
    return Promise.resolve(list);
  }

  findAllLists(): Promise<CustomList[]> {
    return Promise.resolve([...this.lists]);
  }

  findListById(id: number): Promise<CustomList | null> {
    return Promise.resolve(this.lists.find((l) => l.id === id) ?? null);
  }

  deleteList(id: number): Promise<void> {
    remove(this.lists, (l) => l.id === id);
    removeAll(this.entries, (e) => e.listId === id);
    return Promise.resolve();
  }

  findEntriesByList(listId: number): Promise<CustomListEntryWithGame[]> {
    const list = this.entries
      .filter((e) => e.listId === listId)
      .sort((a, b) => a.rank - b.rank)
      .map((e) => this.join(e));
    return Promise.resolve(list);
  }

  findEntryById(entryId: number): Promise<CustomListEntry | null> {
    return Promise.resolve(this.entries.find((e) => e.id === entryId) ?? null);
  }

  findEntryByGame(listId: number, gameId: number): Promise<CustomListEntry | null> {
    return Promise.resolve(
      this.entries.find((e) => e.listId === listId && e.gameId === gameId) ?? null,
    );
  }

  maxRank(listId: number): Promise<number | null> {
    const ranks = this.entries.filter((e) => e.listId === listId).map((e) => e.rank);
    return Promise.resolve(ranks.length ? Math.max(...ranks) : null);
  }

  addEntry(input: { listId: number; gameId: number; rank: number }): Promise<CustomListEntry> {
    const entry: CustomListEntry = {
      id: ++this.entrySeq,
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    return Promise.resolve(entry);
  }

  deleteEntry(entryId: number): Promise<void> {
    remove(this.entries, (e) => e.id === entryId);
    return Promise.resolve();
  }

  setRanks(rankings: RankAssignments): Promise<void> {
    for (const { id, rank } of rankings) {
      const entry = this.entries.find((e) => e.id === id);
      if (entry) entry.rank = rank;
    }
    return Promise.resolve();
  }

  private join(entry: CustomListEntry): CustomListEntryWithGame {
    const game = this.games.byId.get(entry.gameId);
    if (!game) throw new Error(`game ${entry.gameId} missing for list entry ${entry.id}`);
    return { ...entry, game };
  }
}

export interface TestHarness {
  container: AppContainer;
  games: InMemoryGamesRepo;
  entries: InMemoryEntriesRepo;
}

/** Build an AppContainer backed by in-memory fakes, seeded with known metadata. */
export function buildTestHarness(
  seed: GameMetadata[] = [],
  priceQuote: PriceQuote | null = null,
): TestHarness {
  const metadata = new Map(seed.map((m) => [m.igdbId, m]));
  const provider = new FakeMetadataProvider(metadata);
  const prices = new FakePriceProvider(priceQuote);
  const games = new InMemoryGamesRepo();
  const entries = new InMemoryEntriesRepo(games);
  const catalog = new GameCatalog(games, provider);

  const container: AppContainer = {
    searchService: new SearchService(provider),
    entryService: new EntryService(entries, catalog, prices),
    customListService: new CustomListService(new InMemoryCustomListsRepo(games), catalog),
  };
  return { container, games, entries };
}

function remove<T>(arr: T[], match: (item: T) => boolean): void {
  const index = arr.findIndex(match);
  if (index >= 0) arr.splice(index, 1);
}

function removeAll<T>(arr: T[], match: (item: T) => boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (match(arr[i] as T)) arr.splice(i, 1);
  }
}

function compareEntries(a: Entry, b: Entry): number {
  const ra = a.rank ?? Number.POSITIVE_INFINITY;
  const rb = b.rank ?? Number.POSITIVE_INFINITY;
  return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
}
