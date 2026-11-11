/** Profile API calls (cookie auth). */

import { apiRequest } from '../../lib/api';
import type { PublicUser, User } from '../../types';

export interface ProfilePatch {
  username?: string;
  email?: string;
  phone?: string;
  discordUsername?: string;
  avatarUrl?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<User> {
  const data = await apiRequest<{ user: User }>('/users/me', { method: 'PATCH', body: patch });
  return data.user;
}

/** Loads another user's public profile: username + Discord contact. */
export async function getUserById(userId: string): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>(`/users/${userId}`);
  return data.user;
}
