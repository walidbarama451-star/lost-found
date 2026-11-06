export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(statusCode: number, message: string, errors: unknown[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Invalid input', errors: unknown[] = []): AppError {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = 'You are not allowed to perform this action'): AppError {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message);
  }

  static conflict(
    message = 'The request conflicts with the current state',
    errors: unknown[] = [],
  ): AppError {
    return new AppError(409, message, errors);
  }

  static payloadTooLarge(message = 'The uploaded file is too large'): AppError {
    return new AppError(413, message);
  }

  static unsupportedMedia(message = 'Unsupported media type'): AppError {
    return new AppError(415, message);
  }
}
