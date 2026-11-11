/** Display formatting helpers (Intl-based, per spec 11). */

import type { Category, ClaimStatus, ItemStatus, NotificationType } from '../types';

const CATEGORY_LABELS: Record<Category, string> = {
  ELECTRONICS: 'Electronics',
  DOCUMENTS: 'Documents',
  KEYS: 'Keys',
  BAGS: 'Bags',
  ACCESSORIES: 'Accessories',
  CLOTHING: 'Clothing',
  JEWELRY: 'Jewelry',
  PETS: 'Pets',
  OTHER: 'Other',
};

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  ACTIVE: 'Active',
  CLAIMED: 'Claimed',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
  HIDDEN: 'Hidden',
};

const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  CLAIM_SUBMITTED: 'New claim',
  CLAIM_ACCEPTED: 'Claim accepted',
  CLAIM_REJECTED: 'Claim rejected',
  ITEM_RETURNED: 'Item returned',
};

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function itemStatusLabel(status: ItemStatus): string {
  return ITEM_STATUS_LABELS[status] ?? status;
}

export function claimStatusLabel(status: ClaimStatus): string {
  return CLAIM_STATUS_LABELS[status] ?? status;
}

export function notificationLabel(type: NotificationType): string {
  return NOTIFICATION_LABELS[type] ?? type;
}

/** Formats an ISO date string as e.g. "Oct 30, 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Formats an ISO timestamp as e.g. "Oct 30, 2026, 14:05". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
