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

/** Empty values become undefined, exactly like the backend preprocess. */
function optionalText(max: number) {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.string().trim().max(max, `Must be at most ${max} characters`).optional(),
  );
}

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
  locationLabel: z.string().trim().min(1, 'Describe the approximate location').max(120),
  locationCity: optionalText(80),
  locationRegion: optionalText(80),
  locationCountry: optionalText(80),
  dateFound,
});

export type ItemFormValues = {
  title: string;
  description: string;
  category: string;
  locationLabel: string;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  dateFound: string;
};

export const emptyItemValues: ItemFormValues = {
  title: '',
  description: '',
  category: '',
  locationLabel: '',
  locationCity: '',
  locationRegion: '',
  locationCountry: '',
  dateFound: '',
};
