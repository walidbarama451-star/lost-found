import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * central error handler (Express 4 does not do this automatically).
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
