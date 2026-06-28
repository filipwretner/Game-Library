/**
 * Base HTTP client (spec §8.1 api/). The ONLY place that knows how to talk to
 * the backend. Hooks call typed api functions built on this; components never
 * import it directly (enforced by ESLint boundary rules).
 */

const API_BASE = '/api';
const HTTP_NO_CONTENT = 204;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const serverMessage = serverErrorMessage(await res.json().catch(() => null));
    throw new ApiError(res.status, serverMessage ?? `${method} ${path} failed (${res.status})`);
  }
  return (res.status === HTTP_NO_CONTENT ? undefined : await res.json()) as T;
}

/** Pull `error.message` out of our `{ error: { code, message } }` envelope, if present. */
function serverErrorMessage(payload: unknown): string | null {
  if (payload === null || typeof payload !== 'object' || !('error' in payload)) return null;
  const { error } = payload;
  if (error === null || typeof error !== 'object' || !('message' in error)) return null;
  const { message } = error;
  return typeof message === 'string' ? message : null;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export function apiDelete(path: string): Promise<void> {
  return request<void>('DELETE', path);
}
