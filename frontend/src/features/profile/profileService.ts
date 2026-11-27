import { apiRequest } from '@/shared/api/client';
import type { PublicUser, User } from '@/shared/api/types';

export interface ProfilePatch {
  username?: string;
  email?: string;
  phone?: string;
  discordUsername?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<User> {
  const data = await apiRequest<{ user: User }>('/users/me', { method: 'PATCH', body: patch });
  return data.user;
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>(`/users/${userId}`);
  return data.user;
}
