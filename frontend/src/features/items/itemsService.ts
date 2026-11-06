/** Item listings API calls. */

import { apiRequest } from '../../lib/api';
import type { ItemStatus, OwnerItem, Paginated, PublicItem } from '../../types';

export interface ItemListQuery {
  q?: string;
  category?: string;
  city?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}

export interface MyItemsQuery {
  status?: ItemStatus | '';
  page?: number;
  limit?: number;
}

export async function listItems(query: ItemListQuery): Promise<Paginated<PublicItem>> {
  return apiRequest<Paginated<PublicItem>>('/items', {
    query: { ...query, sort: query.sort ?? 'newest' },
  });
}

export async function listMyItems(query: MyItemsQuery): Promise<Paginated<OwnerItem>> {
  return apiRequest<Paginated<OwnerItem>>('/items/mine', { query: { ...query } });
}

export async function getItem(itemId: string): Promise<PublicItem> {
  const data = await apiRequest<{ item: PublicItem }>(`/items/${itemId}`);
  return data.item;
}

/** Multipart create — fields as text, files under the `images` field name. */
export async function createItem(form: FormData): Promise<OwnerItem> {
  const data = await apiRequest<{ item: OwnerItem }>('/items', {
    method: 'POST',
    formData: form,
  });
  return data.item;
}

export interface ItemPatch {
  title?: string;
  description?: string;
  category?: string;
  locationLabel?: string;
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  dateFound?: string;
}

export async function updateItem(itemId: string, patch: ItemPatch): Promise<OwnerItem> {
  const data = await apiRequest<{ item: OwnerItem }>(`/items/${itemId}`, {
    method: 'PATCH',
    body: patch,
  });
  return data.item;
}

/** Soft close (backend maps this to CLOSED). */
export async function closeItem(itemId: string): Promise<OwnerItem> {
  const data = await apiRequest<{ item: OwnerItem }>(`/items/${itemId}`, { method: 'DELETE' });
  return data.item;
}

export async function markReturned(itemId: string): Promise<OwnerItem> {
  const data = await apiRequest<{ item: OwnerItem }>(`/items/${itemId}/return`, {
    method: 'PATCH',
  });
  return data.item;
}

export async function addImages(itemId: string, files: File[]): Promise<OwnerItem> {
  const form = new FormData();
  for (const file of files) form.append('images', file);
  const data = await apiRequest<{ item: OwnerItem }>(`/items/${itemId}/images`, {
    method: 'POST',
    formData: form,
  });
  return data.item;
}

export async function removeImage(itemId: string, publicId: string): Promise<OwnerItem> {
  const data = await apiRequest<{ item: OwnerItem }>(
    `/items/${itemId}/images/${encodeURIComponent(publicId)}`,
    { method: 'DELETE' },
  );
  return data.item;
}
