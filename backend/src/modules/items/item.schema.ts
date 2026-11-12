import { z } from 'zod';

export const createItemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
});

export const updateItemSchema = createItemSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const myItemsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type MyItemsQuery = z.infer<typeof myItemsQuerySchema>;
