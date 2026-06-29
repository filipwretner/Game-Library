import type { Env } from './config/env.js';
import type { MetadataProvider } from './integrations/ports.js';
import { createIgdbClient } from './integrations/igdb/igdbClient.js';
import { IgdbMetadataProvider } from './integrations/igdb/igdbMetadataProvider.js';
import { createCheapsharkClient } from './integrations/cheapshark/cheapsharkClient.js';
import { CheapsharkPriceProvider } from './integrations/cheapshark/cheapsharkPriceProvider.js';
import { prisma } from './repositories/prisma/prismaClient.js';
import { PrismaEntriesRepo } from './repositories/prisma/prismaEntriesRepo.js';
import { PrismaGamesRepo } from './repositories/prisma/prismaGamesRepo.js';
import { PrismaCustomListsRepo } from './repositories/prisma/prismaCustomListsRepo.js';
import { SearchService } from './services/searchService.js';
import { EntryService } from './services/entryService.js';
import { CustomListService } from './services/customListService.js';
import { GameCatalog } from './services/gameCatalog.js';

/**
 * Application container (spec §7.3). Holds the wired services the HTTP layer
 * depends on. Built once from env at boot (buildContainer), or assembled by
 * hand in tests with fakes — which is why createApp takes a container rather
 * than constructing one itself.
 */
export interface AppContainer {
  searchService: SearchService;
  entryService: EntryService;
  customListService: CustomListService;
}

/** Composition root: concrete impls → services. The only place they are wired. */
export function buildContainer(env: Env): AppContainer {
  const metadataProvider = buildMetadataProvider(env);
  const priceProvider = new CheapsharkPriceProvider(createCheapsharkClient());
  const gamesRepo = new PrismaGamesRepo(prisma);
  const entriesRepo = new PrismaEntriesRepo(prisma);
  const customListsRepo = new PrismaCustomListsRepo(prisma);
  const catalog = new GameCatalog(gamesRepo, metadataProvider);

  return {
    searchService: new SearchService(metadataProvider),
    entryService: new EntryService(entriesRepo, catalog, priceProvider),
    customListService: new CustomListService(customListsRepo, catalog),
  };
}

function buildMetadataProvider(env: Env): MetadataProvider {
  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    throw new Error(
      'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are required to start the backend (see .env.example).',
    );
  }
  const igdbClient = createIgdbClient({
    clientId: env.IGDB_CLIENT_ID,
    clientSecret: env.IGDB_CLIENT_SECRET,
  });
  return new IgdbMetadataProvider(igdbClient);
}
