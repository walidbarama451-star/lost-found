/** Shared API response models. Mirrors backend DTOs (spec 05 / 11). */

export type Category =
  | 'ELECTRONICS'
  | 'DOCUMENTS'
  | 'KEYS'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CLOTHING'
  | 'JEWELRY'
  | 'PETS'
  | 'OTHER';

export const CATEGORIES: Category[] = [
  'ELECTRONICS',
  'DOCUMENTS',
  'KEYS',
  'BAGS',
  'ACCESSORIES',
  'CLOTHING',
  'JEWELRY',
  'PETS',
  'OTHER',
];

export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED' | 'HIDDEN';

export const ITEM_STATUSES: ItemStatus[] = ['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN'];

export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type NotificationType =
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_ACCEPTED'
  | 'CLAIM_REJECTED'
  | 'ITEM_RETURNED';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ItemLocation {
  label: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface PublicItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  images: { url: string }[];
  location: ItemLocation;
  dateFound: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; username: string };
}

export interface OwnerItem extends PublicItem {
  images: { url: string; publicId?: string }[];
  acceptedClaim: string | null;
  returnedAt: string | null;
}

export interface MyClaim {
  id: string;
  status: ClaimStatus;
  message: string;
  createdAt: string;
  decisionAt: string | null;
  item: { id: string; title: string; status: string; thumbnail: string | null };
}

export interface ClaimOnItem {
  id: string;
  status: ClaimStatus;
  message: string;
  createdAt: string;
  decisionAt: string | null;
  claimant: { id: string; username: string };
}

export interface AppNotification {
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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface NotificationListResult extends Paginated<AppNotification> {
  unreadCount: number;
}

/** Narrows a backend status string; unknown values map to HIDDEN. */
export function toItemStatus(status: string): ItemStatus {
  return (ITEM_STATUSES as string[]).includes(status) ? (status as ItemStatus) : 'HIDDEN';
}
