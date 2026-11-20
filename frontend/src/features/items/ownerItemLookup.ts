import type { OwnerItem } from '../../types';
import { getItem, listMyItems } from './itemsService';

const SCAN_PAGE_SIZE = 50;
const SCAN_PAGE_CAP = 20;

export async function findOwnerItem(itemId: string): Promise<OwnerItem | null> {
  for (let page = 1; page <= SCAN_PAGE_CAP; page += 1) {
    const list = await listMyItems({ page, limit: SCAN_PAGE_SIZE });
    const match = list.items.find((item) => item.id === itemId);
    if (match) return match;
    if (page >= list.pagination.totalPages) return null;
  }
  return null;
}

export async function getItemForEditing(
  itemId: string,
): Promise<{ item: OwnerItem; canManageImages: boolean }> {
  const ownerItem = await findOwnerItem(itemId);
  if (ownerItem) return { item: ownerItem, canManageImages: true };

  const publicItem = await getItem(itemId);
  return {
    item: { ...publicItem, images: [...publicItem.images], acceptedClaim: null, returnedAt: null },
    canManageImages: false,
  };
}
