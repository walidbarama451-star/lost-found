/** Client-side item validation mirroring backend rules (item.schema.ts). */

import { z } from 'zod';
import { CATEGORIES } from '../../types';

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

export const itemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000),
  category: z
    .string()
    .min(1, 'Choose a category')
    .refine((value) => (CATEGORIES as string[]).includes(value), 'Choose a category'),
  dateFound,
});

export type ItemFormValues = {
  title: string;
  description: string;
  category: string;
  dateFound: string;
};

export const emptyItemValues: ItemFormValues = {
  title: '',
  description: '',
  category: '',
  dateFound: '',
};
