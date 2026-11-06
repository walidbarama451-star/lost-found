import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/AppError.js';
import { User, toSafeUser, type SafeUser, type UserDoc } from './user.model.js';
import type { UpdateProfileInput } from './user.schema.js';

export const PASSWORD_HASH_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_COST);
}

export async function findUserById(id: string): Promise<UserDoc | null> {
  return User.findById(id);
}

export async function findUserByEmailWithPassword(email: string): Promise<UserDoc | null> {
  return User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
}

export async function emailExists(email: string): Promise<boolean> {
  const existing = await User.findOne({ email: email.trim().toLowerCase() }).select('_id');
  return existing !== null;
}

/**
 * Updates only the whitelisted profile fields. `role`, `passwordHash` and
 * every other account flag are structurally impossible to change here.
 */
export async function updateProfile(userId: string, patch: UpdateProfileInput): Promise<SafeUser> {
  const updates: Record<string, string> = {};
  if (patch.username !== undefined) updates.username = patch.username.trim();
  if (patch.email !== undefined) updates.email = patch.email.trim().toLowerCase();
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.avatarUrl !== undefined) updates.avatarUrl = patch.avatarUrl;

  if (updates.email) {
    const clash = await User.findOne({ email: updates.email, _id: { $ne: userId } }).select('_id');
    if (clash) throw AppError.conflict('An account with this email already exists');
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
  if (!user) throw AppError.notFound('User not found');
  return toSafeUser(user);
}
