import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notification.service.js';

function requireUser(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

/** GET /api/notifications — own notifications, newest first. */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as { page?: number; limit?: number };
  const result = await listNotifications(userId, query);
  ok(res, result);
});

/** PATCH /api/notifications/:notificationId/read — mark one as read. */
export const patchRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const notification = await markNotificationRead(userId, req.params.notificationId as string);
  ok(res, { notification }, 'Marked as read');
});

/** PATCH /api/notifications/read-all — mark every own notification read. */
export const patchReadAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const modified = await markAllNotificationsRead(userId);
  ok(res, { modified }, 'All notifications marked as read');
});
