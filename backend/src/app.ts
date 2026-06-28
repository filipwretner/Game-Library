import express, { type Express } from 'express';
import { healthRoutes } from './http/routes/health.routes.js';
import { errorHandler, notFoundHandler } from './http/middleware/errorHandler.js';

/**
 * Composition root (spec §7.3): constructs concrete repositories/providers,
 * injects them into services, injects services into controllers, and mounts the
 * routes. Manual DI — no framework needed at this scale. Returns the app without
 * listening so tests (supertest) can drive it in-process.
 *
 * Only the health slice is wired in the skeleton; feature wiring is added as
 * milestones land.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  api.use(healthRoutes());
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
