import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/AppError.js';
import { toSafeUser, User, type SafeUser } from '../users/user.model.js';
import { PASSWORD_HASH_COST, findUserByEmailWithPassword } from '../users/user.service.js';
import { signAuthToken } from './cookie.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  const existing = await User.findOne({ email }).select('_id');
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_COST);
  const user = await User.create({
    username: input.username.trim(),
    discordUsername: input.discordUsername?.trim() || undefined,
    email,
    passwordHash,
  });

  return { user: toSafeUser(user), token: signAuthToken(user.id) };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const invalidCredentials = AppError.unauthorized('Invalid email or password');

  const user = await findUserByEmailWithPassword(input.email);
  if (!user || !user.passwordHash) {
    throw invalidCredentials;
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw invalidCredentials;
  }

  return { user: toSafeUser(user), token: signAuthToken(user.id) };
}
