import type { Types } from 'mongoose';
import type { ItemDoc, ItemLocation, ItemRecord, ItemStatus } from './item.model.js';

export interface ItemImageDto {
  url: string;
  /** Present only in owner-scoped responses; used to manage images. */
  publicId?: string;
}

export interface ItemDto {
  id: string;
  title: string;
  description: string;
  category: string;
  images: ItemImageDto[];
  location: ItemLocation;
  dateFound: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; username: string };
  /** Owner-scoped only. */
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
    description: item.description,
    category: item.category,
    images: item.images.map((image) => ({ url: image.url })),
    location: item.location,
    dateFound: item.dateFound.toISOString(),
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    owner: ownerOf(item),
  };
}

/** Public listing projection — never includes images' publicIds or claim data. */
export function toPublicItem(item: PopulatedItem): ItemDto {
  return baseDto(item);
}

/** Owner-scoped projection — includes publicIds for image management. */
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
