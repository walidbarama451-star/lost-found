import { z } from 'zod';
import { ITEM_CATEGORIES } from '../items/item.model.js';

const datePattern = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format');

const isNotInTheFuture = (value: string): boolean => {
  const parsed = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= Date.now();
};

const dateLost = datePattern.refine(isNotInTheFuture, 'Date lost cannot be in the future');

export const createLostReportSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(ITEM_CATEGORIES),
  dateLost,
});

export const updateLostReportSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    category: z.enum(ITEM_CATEGORIES),
    dateLost,
    status: z.enum(['OPEN', 'CLOSED']),
  })
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const lostReportsQuerySchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
});

export type CreateLostReportInput = z.infer<typeof createLostReportSchema>;
export type UpdateLostReportInput = z.infer<typeof updateLostReportSchema>;
export type LostReportsQuery = z.infer<typeof lostReportsQuerySchema>;
