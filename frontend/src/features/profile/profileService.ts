/** Profile API calls (cookie auth). */

import { apiRequest } from '../../lib/api';
import type { User } from '../../types';

export interface ProfilePatch {
  username?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<User> {
  const data = await apiRequest<{ user: User }>('/users/me', { method: 'PATCH', body: patch });
  return data.user;
}
