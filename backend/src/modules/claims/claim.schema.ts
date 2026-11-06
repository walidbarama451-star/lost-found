import { z } from 'zod';

const objectIdPattern = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const createClaimSchema = z.object({
  itemId: objectIdPattern,
  message: z
    .string()
    .trim()
    .min(10, 'Explain how you can identify the item (at least 10 characters)')
    .max(2000, 'The claim message must be at most 2000 characters'),
});

export const decisionSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
