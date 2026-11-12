/** Client-side lost-report validation mirroring the backend rules. */

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

const dateLost = datePattern.refine(isNotInTheFuture, 'Date lost cannot be in the future');

export const lostReportSchema = z.object({
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
  dateLost,
});

export type LostReportFormValues = {
  title: string;
  description: string;
  category: string;
  dateLost: string;
};

export const emptyLostReportValues: LostReportFormValues = {
  title: '',
  description: '',
  category: '',
  dateLost: '',
};
