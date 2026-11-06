import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { getNotifications, patchRead, patchReadAll } from './notification.controller.js';

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
});

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, validate(pageQuerySchema, 'query'), getNotifications);
notificationsRouter.patch('/read-all', authenticate, patchReadAll);
notificationsRouter.patch('/:notificationId/read', authenticate, patchRead);
