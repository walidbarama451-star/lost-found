/** Notifications API calls (cookie auth). */

import { apiRequest } from '../../lib/api';
import type { AppNotification, NotificationListResult } from '../../types';

export async function listNotifications(
  page = 1,
  limit = 12,
): Promise<NotificationListResult> {
  return apiRequest<NotificationListResult>('/notifications', { query: { page, limit } });
}

export async function markNotificationRead(notificationId: string): Promise<AppNotification> {
  const data = await apiRequest<{ notification: AppNotification }>(
    `/notifications/${notificationId}/read`,
    { method: 'PATCH' },
  );
  return data.notification;
}

export async function markAllNotificationsRead(): Promise<number> {
  const data = await apiRequest<{ modified: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
  return data.modified;
}
