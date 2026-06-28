/**
 * Typed domain errors (spec §7.4). Services throw these; one middleware maps
 * them to HTTP status codes. No per-route try/catch.
 */

export abstract class DomainError extends Error {
  abstract readonly status: number;
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  readonly status = 404;
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND');
  }
}

export class ValidationError extends DomainError {
  readonly status = 400;
  constructor(message = 'Invalid request') {
    super(message, 'VALIDATION');
  }
}

export class ConflictError extends DomainError {
  readonly status = 409;
  constructor(message = 'Conflicting request') {
    super(message, 'CONFLICT');
  }
}

/** An upstream/external API (IGDB, CheapShark) failed or misbehaved. */
export class BadGatewayError extends DomainError {
  readonly status = 502;
  constructor(message = 'Upstream service error') {
    super(message, 'BAD_GATEWAY');
  }
}
