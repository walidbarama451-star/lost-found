import type { AuthUser } from './auth.js';

declare module 'express-serve-static-core' {
  interface Request {
    /** Populated by the authenticate middleware from the verified token. */
    user?: AuthUser;
    /** Parsed+validated query string (Express 4 query getter is read-only). */
    validatedQuery?: unknown;
    /** Correlation id attached to every request. */
    requestId?: string;
  }
}

export {};
