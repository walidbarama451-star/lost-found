import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../errors/AppError.js';

/**
 * Validates a route parameter that must be a MongoDB ObjectId.
 * Returns the canonical ObjectId string or throws a 400.
 */
export function parseObjectId(value: string, paramName = 'id'): Types.ObjectId {
  if (!isValidObjectId(value)) {
    throw AppError.badRequest(`${paramName} is not a valid identifier`);
  }
  return new Types.ObjectId(value);
}
