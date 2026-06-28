import type { Env } from './config/env.js';
import type { MetadataProvider } from './integrations/ports.js';
import { createIgdbClient } from './integrations/igdb/igdbClient.js';
import { IgdbMetadataProvider } from './integrations/igdb/igdbMetadataProvider.js';
import { SearchService } from './services/searchService.js';

/**
 * Application container (spec §7.3). Holds the wired services the HTTP layer
 * depends on. Built once from env at boot (buildContainer), or assembled by
 * hand in tests with fakes — which is why createApp takes a container rather
 * than constructing one itself.
 */
export interface AppContainer {
  searchService: SearchService;
}

/** Composition root: concrete impls → services. The only place they are wired. */
export function buildContainer(env: Env): AppContainer {
  const metadataProvider: MetadataProvider = buildMetadataProvider(env);
  const searchService = new SearchService(metadataProvider);
  return { searchService };
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
