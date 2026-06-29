import type { z } from 'zod';
import { ValidationError } from '../domain/errors.js';

/** Validate request data against a Zod schema, throwing a typed ValidationError. */
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid request');
  }
  return result.data;
}
