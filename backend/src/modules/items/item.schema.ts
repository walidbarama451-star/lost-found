import { z } from 'zod';
import { ITEM_CATEGORIES } from './item.model.js';

const datePattern = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format');

const isNotInTheFuture = (value: string): boolean => {
  const parsed = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= Date.now();
};

const dateFound = datePattern.refine(isNotInTheFuture, 'Date found cannot be in the future');

export const createItemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(ITEM_CATEGORIES),
  dateFound,
});

export const updateItemSchema = createItemSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listItemsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  fromDate: datePattern.optional(),
  toDate: datePattern.optional(),
  page: z.coerce.number().int().min(1, 'page must be a positive integer').default(1),
  limit: z.coerce.number().int().min(1, 'limit must be a positive integer').default(12),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export const myItemsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type MyItemsQuery = z.infer<typeof myItemsQuerySchema>;
