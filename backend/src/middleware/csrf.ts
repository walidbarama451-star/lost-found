import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireSameOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const origin = req.headers.origin ?? req.headers.referer?.replace(/\/$/, '');
  if (!origin) {
    next();
    return;
  }

  const allowed = new Set<string>([env.clientUrl.replace(/\/$/, '')]);
  try {
    allowed.add(`${req.protocol}://${req.get('host')}`);
  } catch {

  }

  if (!allowed.has(origin)) {
    next(AppError.forbidden('Cross-origin request rejected'));
    return;
  }

  next();
}
