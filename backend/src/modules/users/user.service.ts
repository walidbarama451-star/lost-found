import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/AppError.js';
import { parseObjectId } from '../../shared/utils/objectId.js';
import {
  User,
  toPublicUser,
  toSafeUser,
  type PublicUser,
  type SafeUser,
  type UserDoc,
} from './user.model.js';
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
 * Loads another account's public profile: username and Discord contact only.
 * Email and phone are never answered here — they stay private to the account.
 */
export async function getPublicProfile(userId: string): Promise<PublicUser> {
  const oid = parseObjectId(userId, 'userId');
  const user = await User.findById(oid).select('_id username discordUsername createdAt');
  if (!user) throw AppError.notFound('User not found');
  return toPublicUser(user);
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

  // Empty Discord username clears the field ($unset) — it is optional.
  const clearDiscord = patch.discordUsername === '';
  if (patch.discordUsername) updates.discordUsername = patch.discordUsername;

  if (updates.email) {
    const clash = await User.findOne({ email: updates.email, _id: { $ne: userId } }).select('_id');
    if (clash) throw AppError.conflict('An account with this email already exists');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: updates,
      ...(clearDiscord ? { $unset: { discordUsername: '' } } : {}),
    },
    { new: true, runValidators: true },
  );
  if (!user) throw AppError.notFound('User not found');
  return toSafeUser(user);
}
