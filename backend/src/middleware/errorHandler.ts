import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/AppError.js';

interface MongoDuplicateKeyError {
  code?: number;
  message?: string;
}

/**
 * Central error handler. Expected errors return safe messages; unexpected
 * errors are logged server-side and never leak stack traces in production.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ success: false, message: 'Each image must be 5 MB or smaller', errors: [] });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ success: false, message: 'A listing can have at most 5 images', errors: [] });
      return;
    }
    res.status(400).json({ success: false, message: 'Invalid file upload', errors: [] });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  // Invalid ObjectId or other malformed database identifier.
  if ((error as { name?: string }).name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid identifier', errors: [] });
    return;
  }

  const mongoError = error as MongoDuplicateKeyError;
  if (mongoError?.code === 11000) {
    res.status(409).json({
      success: false,
      message: 'A record with the same unique value already exists',
      errors: [],
    });
    return;
  }

  console.error(
    `[${new Date().toISOString()}] ${req.requestId ?? '-'} ${req.method} ${req.originalUrl}`,
    error,
  );

  res.status(500).json({
    success: false,
    message: env.isProduction
      ? 'Internal server error'
      : error instanceof Error
        ? error.message
        : 'Unexpected error',
    errors: [],
  });
};
