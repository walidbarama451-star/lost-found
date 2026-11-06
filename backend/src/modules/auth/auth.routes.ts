import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { getMe } from '../users/user.controller.js';
import { login, logout, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema, 'body'), register);
authRouter.post('/login', authLimiter, validate(loginSchema, 'body'), login);
authRouter.get('/me', authenticate, getMe);
authRouter.post('/logout', logout);
