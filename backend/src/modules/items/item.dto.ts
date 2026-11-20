import type { Types } from 'mongoose';
import type { ItemDoc, ItemRecord, ItemStatus } from './item.model.js';

export interface ItemImageDto {
  url: string;
  publicId?: string;
}

export interface ItemDto {
  id: string;
  title: string;
  images: ItemImageDto[];
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; username: string };
  acceptedClaim?: string | null;
  returnedAt?: string | null;
}

type OwnerRef = Types.ObjectId | { _id: Types.ObjectId; username: string };

export type PopulatedItem = Omit<ItemRecord, 'createdBy'> & { createdBy: OwnerRef };

function ownerOf(item: PopulatedItem): { id: string; username: string } {
  const ref = item.createdBy as { _id?: Types.ObjectId; username?: string };
  if (ref && typeof ref === 'object' && 'username' in ref) {
    return { id: (ref._id as Types.ObjectId).toString(), username: ref.username ?? 'Unknown user' };
  }
  return { id: String(item.createdBy), username: 'Unknown user' };
}

function baseDto(item: PopulatedItem): ItemDto {
  return {
    id: item._id.toString(),
    title: item.title,
    images: item.images.map((image) => ({ url: image.url })),
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    owner: ownerOf(item),
  };
}

export function toPublicItem(item: PopulatedItem): ItemDto {
  return baseDto(item);
}

export function toOwnerItem(item: PopulatedItem): ItemDto {
  const dto = baseDto(item);
  dto.images = item.images.map((image) => ({ url: image.url, publicId: image.publicId }));
  dto.acceptedClaim = item.acceptedClaim ? item.acceptedClaim.toString() : null;
  dto.returnedAt = item.returnedAt ? item.returnedAt.toISOString() : null;
  return dto;
}

export function asPopulated(doc: ItemDoc): PopulatedItem {
  return doc as unknown as PopulatedItem;
}
