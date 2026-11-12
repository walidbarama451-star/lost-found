/** Client-side item validation mirroring backend rules (item.schema.ts). */

import { z } from 'zod';

export const itemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
});

export type ItemFormValues = {
  title: string;
};

export const emptyItemValues: ItemFormValues = {
  title: '',
};
