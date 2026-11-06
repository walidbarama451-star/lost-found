import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function ok<T>(res: Response, data: T, message?: string, status = 200): Response {
  const body: { success: true; data: T; message?: string } = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return ok(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
