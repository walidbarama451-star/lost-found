import type { ClaimStatus, ItemStatus } from '@/shared/api/types';

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

export function itemStatusLabel(status: ItemStatus): string {
  return ITEM_STATUS_LABELS[status] ?? status;
}

export function claimStatusLabel(status: ClaimStatus): string {
  return CLAIM_STATUS_LABELS[status] ?? status;
}

/** 1234567 → "1,234,567" (en-US keeps columns stable and readable). */
export const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** ISO timestamp → "just now" / "5m ago" / "3h ago" / "2d ago". */
export const formatRelativeTime = (iso: string, now: Date = new Date()): string => {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return 'unknown';

  const elapsed = now.getTime() - timestamp;
  if (elapsed < MINUTE_MS) return 'just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  return `${Math.floor(elapsed / DAY_MS)}d ago`;
};
