export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED' | 'HIDDEN';

export const ITEM_STATUSES: ItemStatus[] = ['ACTIVE', 'CLAIMED', 'RETURNED', 'CLOSED', 'HIDDEN'];

export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface User {
  id: string;
  username: string;
  discordUsername?: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  discordUsername?: string;
  createdAt: string;
}

export interface PublicItem {
  id: string;
  title: string;
  images: { url: string }[];
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

export type LostReportStatus = 'OPEN' | 'CLOSED';

export type MatchMethod = 'photo' | 'text';

export interface LostReportMatch {
  itemId: string;
  score: number;
  method: MatchMethod;
  title: string;
  status: ItemStatus;
  image: string | null;
  available: boolean;
}

export interface LostReport {
  id: string;
  title: string;
  status: LostReportStatus;
  images: { url: string }[];
  matches: LostReportMatch[];
  lastSearchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimOnItem {
  id: string;
  status: ClaimStatus;
  message: string;
  createdAt: string;
  decisionAt: string | null;
  claimant: { id: string; username: string };
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

export function toItemStatus(status: string): ItemStatus {
  return (ITEM_STATUSES as string[]).includes(status) ? (status as ItemStatus) : 'HIDDEN';
}
