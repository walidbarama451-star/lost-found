import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AUTH_COOKIE } from '../modules/auth/cookie.js';
import { findUserById } from '../modules/users/user.service.js';
import { AppError } from '../shared/errors/AppError.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token || typeof token !== 'string') {
      throw AppError.unauthorized('Authentication required');
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    } catch {
      throw AppError.unauthorized('Your session is invalid or has expired');
    }

    const subject = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!subject) {
      throw AppError.unauthorized('Your session is invalid or has expired');
    }

    const user = await findUserById(subject);
    if (!user) {
      throw AppError.unauthorized('Your session is invalid or has expired');
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
