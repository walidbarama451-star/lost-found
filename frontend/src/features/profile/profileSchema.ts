/** Client-side profile validation mirroring backend rules (user.schema.ts). */

import { z } from 'zod';

export const profileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters'),
    email: z.string().trim().email('Enter a valid email').max(254),
    phone: z.string().trim().max(30, 'Phone number is too long'),
    avatarUrl: z
      .string()
      .trim()
      .max(500)
      .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), 'Avatar must be a valid URL'),
  })
  .refine((data) => Object.values(data).some((value) => value !== ''), {
    message: 'Provide at least one field to update',
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
