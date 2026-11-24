import bcrypt from 'bcrypt';
import type { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parseObjectId } from '../../shared/utils/objectId.js';
import {
  User,
  toPublicUser,
  toSafeUser,
  type PublicUser,
  type SafeUser,
  type UserDoc,
  type UserRecord,
} from './user.model.js';
import type { UpdateProfileInput } from './user.schema.js';

export const PASSWORD_HASH_COST = env.bcryptCost;

export type AuthUserRecord = Pick<UserRecord, 'username' | 'email' | 'role'> & {
  _id: Types.ObjectId;
};

export interface CachedAuthUser {
  user: AuthUserRecord;
  expiresAt: number;
}

const authUserCache = new Map<string, CachedAuthUser>();

export function getAuthUserCacheSize(): number {
  return authUserCache.size;
}

export function invalidateAuthUserCache(userId?: string): void {
  if (userId) {
    authUserCache.delete(userId);
  } else {
    authUserCache.clear();
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_COST);
}

export async function findUserById(id: string, ttlMs = env.userCacheTtlMs): Promise<AuthUserRecord | null> {
  const now = Date.now();
  const cached = authUserCache.get(id);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = await User.findById(id).select('_id username email role').lean<AuthUserRecord>();
  if (user) {
    if (ttlMs > 0) {
      authUserCache.set(id, { user, expiresAt: now + ttlMs });
    }
  } else {
    authUserCache.delete(id);
  }
  return user;
}

export async function findUserByEmailWithPassword(email: string): Promise<UserDoc | null> {
  return User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
}

export async function emailExists(email: string): Promise<boolean> {
  const existing = await User.findOne({ email: email.trim().toLowerCase() }).select('_id');
  return existing !== null;
}

export async function getPublicProfile(userId: string): Promise<PublicUser> {
  const oid = parseObjectId(userId, 'userId');
  const user = await User.findById(oid).select('_id username discordUsername createdAt');
  if (!user) throw AppError.notFound('User not found');
  return toPublicUser(user);
}

export async function updateProfile(userId: string, patch: UpdateProfileInput): Promise<SafeUser> {
  const updates: Record<string, string> = {};
  if (patch.username !== undefined) updates.username = patch.username.trim();
  if (patch.email !== undefined) updates.email = patch.email.trim().toLowerCase();
  if (patch.phone !== undefined) updates.phone = patch.phone;

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
  invalidateAuthUserCache(userId);
  return toSafeUser(user);
}
