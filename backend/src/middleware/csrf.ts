import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-based auth: mutating requests must carry an
 * Origin (or Referer) header that matches the configured client origin or
 * the API's own origin. Combined with the SameSite=Lax cookie this blocks
 * cross-site form posts and fetches.
 */
export function requireSameOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const origin = req.headers.origin ?? req.headers.referer?.replace(/\/$/, '');
  if (!origin) {
    // Non-browser client (curl / API test tool): the SameSite cookie rule
    // still prevents browsers from sending the credential cross-site.
    next();
    return;
  }

  const allowed = new Set<string>([env.clientUrl.replace(/\/$/, '')]);
  try {
    allowed.add(`${req.protocol}://${req.get('host')}`);
  } catch {
    // Host header unavailable — fall back to configured origins only.
  }

  if (!allowed.has(origin)) {
    next(AppError.forbidden('Cross-origin request rejected'));
    return;
  }

  next();
}
