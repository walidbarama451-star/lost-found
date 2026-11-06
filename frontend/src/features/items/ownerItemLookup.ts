/** Owner lookup helper for the edit page (public detail lacks image publicIds). */

import type { OwnerItem } from '../../types';
import { getItem, listMyItems } from './itemsService';

const SCAN_PAGE_SIZE = 50;
const SCAN_PAGE_CAP = 20;

/**
 * The public `GET /items/:itemId` response never includes image publicIds
 * (spec 05 — public payloads must not leak them), and there is no owner
 * detail endpoint. Image management therefore reads the owner projection
 * from `/items/mine`, scanning pages until the listing is found.
 *
 * Returns `null` when the listing is not among the caller's own items
 * (or beyond the scan cap) — the caller falls back to the public payload.
 */
export async function findOwnerItem(itemId: string): Promise<OwnerItem | null> {
  for (let page = 1; page <= SCAN_PAGE_CAP; page += 1) {
    const list = await listMyItems({ page, limit: SCAN_PAGE_SIZE });
    const match = list.items.find((item) => item.id === itemId);
    if (match) return match;
    if (page >= list.pagination.totalPages) return null;
  }
  return null;
}

/** Prefers the owner projection; falls back to the public payload. */
export async function getItemForEditing(
  itemId: string,
): Promise<{ item: OwnerItem; canManageImages: boolean }> {
  const ownerItem = await findOwnerItem(itemId);
  if (ownerItem) return { item: ownerItem, canManageImages: true };

  // Not found among own listings: show the public payload (image removal is
  // disabled because publicIds are intentionally not exposed there).
  const publicItem = await getItem(itemId);
  return {
    item: { ...publicItem, images: [...publicItem.images], acceptedClaim: null, returnedAt: null },
    canManageImages: false,
  };
}
