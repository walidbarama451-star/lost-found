import { z } from 'zod';

export const createLostReportSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
});

export const updateLostReportSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
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
