import type { ErrorRequestHandler, RequestHandler } from 'express';
import { DomainError } from '../../domain/errors.js';

/** 404 for unmatched routes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

/**
 * Centralised error handler (spec §7.4): maps typed domain errors to status
 * codes; everything else is a 500. Must be the last middleware mounted.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Unexpected error: log the detail server-side, never leak it to the client.
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
