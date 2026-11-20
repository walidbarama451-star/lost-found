import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import { User, toSafeUser } from './user.model.js';
import type { UpdateProfileInput } from './user.schema.js';
import { getPublicProfile, updateProfile } from './user.service.js';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const doc = await User.findById(req.user.id);
  if (!doc) throw AppError.unauthorized('Your session is invalid or has expired');

  ok(res, { user: toSafeUser(doc) });
});

export const patchMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const updated = await updateProfile(req.user.id, req.body as UpdateProfileInput);
  ok(res, { user: updated }, 'Profile updated');
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();

  const profile = await getPublicProfile(req.params.userId as string);
  ok(res, { user: profile });
});
