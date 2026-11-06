import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../shared/errors/AppError.js';

type Source = 'body' | 'params' | 'query';

/**
 * Validates the chosen request part with a Zod schema and replaces it with
 * the parsed (and transformed) value.
 *
 * Note: Express 4 exposes `req.query` through a read-only getter, so parsed
 * query values are stored on `req.validatedQuery` instead.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      next(AppError.badRequest('Validation failed', errors));
      return;
    }

    if (source === 'query') {
      req.validatedQuery = result.data;
    } else if (source === 'params') {
      req.params = result.data as Request['params'];
    } else {
      req.body = result.data;
    }

    next();
  };
}
