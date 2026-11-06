import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { Notification, type NotificationRecord, type NotificationType } from './notification.model.js';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItem: string | null;
  relatedClaim: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItem?: string;
  relatedClaim?: string;
}

export interface NotificationListResult {
  items: NotificationDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
  unreadCount: number;
}

function toDto(record: NotificationRecord): NotificationDto {
  return {
    id: record._id.toString(),
    type: record.type,
    title: record.title,
    message: record.message,
    relatedItem: record.relatedItem ? record.relatedItem.toString() : null,
    relatedClaim: record.relatedClaim ? record.relatedClaim.toString() : null,
    read: record.readAt !== undefined && record.readAt !== null,
    readAt: record.readAt ? record.readAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Creates an in-app notification AFTER the related business action succeeded.
 * Notification delivery never rolls back the business action; failures are
 * logged so they can be investigated.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await Notification.create({
      recipient: input.recipient,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedItem: input.relatedItem,
      relatedClaim: input.relatedClaim,
    });
  } catch (error) {
    console.error(
      '[notifications] failed to create notification:',
      error instanceof Error ? error.message : error,
    );
  }
}

export async function listNotifications(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<NotificationListResult> {
  const { page, limit } = parsePagination(query);
  const filter = { recipient: new Types.ObjectId(userId) };

  const [docs, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, readAt: null }),
  ]);

  return {
    items: docs.map(toDto),
    pagination: buildPaginationMeta(page, limit, total),
    unreadCount,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ recipient: new Types.ObjectId(userId), readAt: null });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<NotificationDto> {
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: new Types.ObjectId(userId) },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!doc) throw AppError.notFound('Notification not found');
  return toDto(doc);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await Notification.updateMany(
    { recipient: new Types.ObjectId(userId), readAt: null },
    { $set: { readAt: new Date() } },
  );
  return result.modifiedCount;
}
