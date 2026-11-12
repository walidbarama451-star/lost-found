import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30).optional(),
    email: z.string().trim().email('Enter a valid email').max(254).optional(),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number is too long')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    discordUsername: z
      .string()
      .trim()
      .min(2, 'Discord username must be at least 2 characters')
      .max(32, 'Discord username must be at most 32 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
