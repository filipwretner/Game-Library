import express, { type Express } from 'express';
import type { AppContainer } from './container.js';
import { healthRoutes } from './http/routes/health.routes.js';
import { gamesRoutes } from './http/routes/games.routes.js';
import { entriesRoutes } from './http/routes/entries.routes.js';
import { errorHandler, notFoundHandler } from './http/middleware/errorHandler.js';

/**
 * Builds the Express app from a pre-wired container (spec §7.3). Manual DI: the
 * container is constructed at the composition root (buildContainer) or by tests
 * with fakes. Returns the app without listening so supertest can drive it.
 */
export function createApp(container: AppContainer): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(healthRoutes());
  api.use(gamesRoutes(container.searchService));
  api.use(entriesRoutes(container.entryService));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
