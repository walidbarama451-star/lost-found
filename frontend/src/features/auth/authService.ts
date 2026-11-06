/** Auth API calls (cookie session — no tokens in JS). */

import { apiRequest } from '../../lib/api';
import type { User } from '../../types';
import type { LoginInput, RegisterInput } from './authSchemas';

export async function registerUser(input: RegisterInput): Promise<User> {
  const data = await apiRequest<{ user: User }>('/auth/register', {
    method: 'POST',
    body: input,
    skipAuthRedirect: true,
  });
  return data.user;
}

export async function loginUser(input: LoginInput): Promise<User> {
  const data = await apiRequest<{ user: User }>('/auth/login', {
    method: 'POST',
    body: input,
    skipAuthRedirect: true,
  });
  return data.user;
}

export async function logoutUser(): Promise<void> {
  await apiRequest<null>('/auth/logout', { method: 'POST', skipAuthRedirect: true });
}

/** Session bootstrap — a 401 here just means "guest", not a redirect. */
export async function fetchCurrentUser(): Promise<User | null> {
  const data = await apiRequest<{ user: User }>('/auth/me', { skipAuthRedirect: true });
  return data.user;
}
