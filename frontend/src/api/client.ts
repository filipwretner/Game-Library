/**
 * Base HTTP client (spec §8.1 api/). The ONLY place that knows how to talk to
 * the backend. Hooks call typed api functions built on this; components never
 * import it directly (enforced by ESLint boundary rules).
 */

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
