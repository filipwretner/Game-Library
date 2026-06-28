import type { RequestHandler } from 'express';

/**
 * Thin controller (spec §7.1): no business logic, no DB. Proves the
 * route → controller → response path is wired from day one.
 */
export const getHealth: RequestHandler = (_req, res) => {
  res.json({ status: 'ok' });
};
