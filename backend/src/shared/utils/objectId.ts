import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../errors/AppError.js';

export function parseObjectId(value: string, paramName = 'id'): Types.ObjectId {
  if (!isValidObjectId(value)) {
    throw AppError.badRequest(`${paramName} is not a valid identifier`);
  }
  return new Types.ObjectId(value);
}
