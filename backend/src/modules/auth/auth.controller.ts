import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { created, ok } from '../../shared/utils/response.js';
import { clearAuthCookie, setAuthCookie } from './cookie.js';
import { loginUser, registerUser } from './auth.service.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await registerUser(req.body as RegisterInput);
  setAuthCookie(res, token);
  created(res, { user }, 'Account created');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await loginUser(req.body as LoginInput);
  setAuthCookie(res, token);
  ok(res, { user }, 'Signed in');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  ok(res, null, 'Signed out');
});
