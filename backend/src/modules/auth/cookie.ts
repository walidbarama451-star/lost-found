import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

/** Name of the HttpOnly cookie that carries the JWT access token. */
export const AUTH_COOKIE = 'lost_and_found_token';

const TOKEN_MAX_AGE_MS = 30 * 60 * 1000; // matches default 30m expiry

export function signAuthToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Sets the token in a cookie the browser JS cannot read. */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}
