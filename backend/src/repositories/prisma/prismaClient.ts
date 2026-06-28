import { PrismaClient } from '@prisma/client';

/**
 * The single PrismaClient instance. This file (and the *.repo.ts siblings) are
 * the ONLY place @prisma/client may be imported — enforced by ESLint boundary
 * rules. Services receive repository ports, never this client.
 */
export const prisma = new PrismaClient();
