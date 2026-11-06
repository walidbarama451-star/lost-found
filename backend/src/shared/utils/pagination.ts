import { AppError } from '../errors/AppError.js';
import type { PaginationMeta } from './response.js';

export interface PageParams {
  page: number;
  limit: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 50;

/**
 * Parses and clamps pagination input coming from a validated query string.
 */
export function parsePagination(input: { page?: unknown; limit?: unknown }): PageParams {
  const rawPage = Number(input.page ?? DEFAULT_PAGE);
  const rawLimit = Number(input.limit ?? DEFAULT_LIMIT);

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    throw AppError.badRequest('page must be a positive integer');
  }
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    throw AppError.badRequest('limit must be a positive integer');
  }

  return { page: rawPage, limit: Math.min(rawLimit, MAX_LIMIT) };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
