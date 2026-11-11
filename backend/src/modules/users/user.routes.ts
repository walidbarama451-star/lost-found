import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { getUserById, getMe, patchMe } from './user.controller.js';
import { updateProfileSchema } from './user.schema.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getMe);
usersRouter.patch('/me', authenticate, validate(updateProfileSchema, 'body'), patchMe);
usersRouter.get('/:userId', authenticate, getUserById);
