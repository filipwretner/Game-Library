import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

export function healthRoutes(): Router {
  const router = Router();
  router.get('/health', getHealth);
  return router;
}
