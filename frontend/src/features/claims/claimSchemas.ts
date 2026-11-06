/** Client-side claim validation mirroring backend rules (claim.schema.ts). */

import { z } from 'zod';

export const claimSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Explain how you can identify the item (at least 10 characters)')
    .max(2000, 'The claim message must be at most 2000 characters'),
});

export type ClaimFormValues = z.infer<typeof claimSchema>;
