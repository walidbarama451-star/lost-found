import type { FilterQuery } from 'mongoose';
import { deleteImage, storeImage } from '../../config/imageStorage.js';
import { embedImage } from '../../config/imageEmbedding.js';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { LostReport } from '../lostReports/lostReport.model.js';
import { asPopulated, toOwnerItem, toPublicItem, type ItemDto } from './item.dto.js';
import { Item, type ItemDoc, type ItemRecord, type ItemStatus } from './item.model.js';
import type { CreateItemInput, MyItemsQuery, UpdateItemInput } from './item.schema.js';

interface ItemListResult {
  items: ItemDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

/** Stores the uploaded files and attaches embeddings when the service is up. */
async function storeImages(
  files: Express.Multer.File[],
): Promise<{ url: string; publicId: string; embedding?: number[] }[]> {
  const stored: { url: string; publicId: string; embedding?: number[] }[] = [];
  for (const file of files) {
    const image = await storeImage(file.buffer, file.mimetype);
    const embedding = await embedImage(file.buffer, file.mimetype);
    stored.push(embedding ? { ...image, embedding } : image);
  }
  return stored;
}

export async function listMyItems(userId: string, query: MyItemsQuery): Promise<ItemListResult> {
  const { page, limit } = parsePagination(query);
  const filter: FilterQuery<ItemRecord> = { createdBy: userId };
  if (query.status) filter.status = query.status;
  const sort = query.sort === 'oldest' ? ({ createdAt: 1 } as const) : ({ createdAt: -1 } as const);

  const [docs, total] = await Promise.all([
    Item.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username'),
    Item.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toOwnerItem(asPopulated(doc))),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function loadVisibleItem(itemId: string): Promise<ItemDoc | null> {
  const doc = await Item.findById(itemId).populate('createdBy', 'username');
  if (!doc || doc.status === 'HIDDEN') return null;
  return doc;
}

function isOwner(doc: ItemDoc, userId: string): boolean {
  const owner = doc.createdBy as { _id?: unknown };
  const ownerId = owner && typeof owner === 'object' && '_id' in owner ? owner._id : doc.createdBy;
  return String(ownerId) === userId;
}

/**
 * Item detail is no longer public: it is visible to the owner (full DTO) and
 * to users whose lost report matched the item (public DTO). Everyone else
 * gets a 404, so item existence is never revealed to outsiders.
 */
export async function getVisibleItem(itemId: string, userId: string): Promise<ItemDto> {
  const doc = await loadVisibleItem(itemId);
  if (!doc) throw AppError.notFound('Listing not found');

  if (isOwner(doc, userId)) return toOwnerItem(asPopulated(doc));

  const matched = await LostReport.exists({ owner: userId, 'matches.item': itemId });
  if (!matched) throw AppError.notFound('Listing not found');

  return toPublicItem(asPopulated(doc));
}

export async function getOwnerItem(itemId: string, userId: string): Promise<ItemDto> {
  const doc = await loadVisibleItem(itemId);
  if (!doc) throw AppError.notFound('Listing not found');
  if (!isOwner(doc, userId)) throw AppError.forbidden('You can only manage your own listings');
  return toOwnerItem(asPopulated(doc));
}

export async function createItem(
  userId: string,
  input: CreateItemInput,
  files: Express.Multer.File[],
): Promise<ItemDto> {
  if (files.length === 0) {
    throw AppError.badRequest('At least one image is required');
  }

  const uploaded = await storeImages(files);
  try {
    const doc = await Item.create({
      title: input.title,
      images: uploaded,
      createdBy: userId,
      status: 'ACTIVE',
    });

    await doc.populate('createdBy', 'username');
    return toOwnerItem(asPopulated(doc));
  } catch (error) {
    // Listing creation failed after upload — clean up the orphaned assets.
    await Promise.all(uploaded.map((image) => deleteImage(image.publicId)));
    throw error;
  }
}

function buildUpdateSet(patch: UpdateItemInput): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  if (patch.title !== undefined) set.title = patch.title;
  return set;
}

export async function updateItem(itemId: string, userId: string, patch: UpdateItemInput): Promise<ItemDto> {
  const existing = await Item.findById(itemId);
  if (!existing) throw AppError.notFound('Listing not found');
  if (existing.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only manage your own listings');

  const set = buildUpdateSet(patch);
  if (Object.keys(set).length === 0) throw AppError.badRequest('Provide at least one field to update');

  const doc = await Item.findOneAndUpdate(
    { _id: itemId, createdBy: userId },
    { $set: set },
    { new: true, runValidators: true },
  ).populate('createdBy', 'username');
  if (!doc) throw AppError.notFound('Listing not found');

  return toOwnerItem(asPopulated(doc));
}

export async function closeItem(itemId: string, userId: string): Promise<ItemDto> {
  const existing = await Item.findById(itemId);
  if (!existing) throw AppError.notFound('Listing not found');
  if (existing.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only manage your own listings');
  if (existing.status === 'RETURNED') throw AppError.conflict('A returned listing cannot be closed');
  if (existing.status !== 'CLOSED') {
    existing.status = 'CLOSED';
    await existing.save();
  }
  await existing.populate('createdBy', 'username');
  return toOwnerItem(asPopulated(existing));
}

export async function markReturned(itemId: string, userId: string): Promise<ItemDto> {
  const doc = await Item.findOneAndUpdate(
    { _id: itemId, createdBy: userId, status: 'CLAIMED' },
    { $set: { status: 'RETURNED', returnedAt: new Date() } },
    { new: true },
  );

  if (!doc) {
    const existing = await Item.findById(itemId);
    if (!existing) throw AppError.notFound('Listing not found');
    if (existing.createdBy.toString() !== userId)
      throw AppError.forbidden('You can only manage your own listings');
    throw AppError.conflict('Only a listing with an accepted claim can be marked as returned');
  }

  await doc.populate('createdBy', 'username');

  return toOwnerItem(asPopulated(doc));
}

export async function addImages(
  itemId: string,
  userId: string,
  files: Express.Multer.File[],
): Promise<ItemDto> {
  if (files.length === 0) throw AppError.badRequest('Select at least one image to upload');

  const existing = await Item.findById(itemId);
  if (!existing) throw AppError.notFound('Listing not found');
  if (existing.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only manage your own listings');
  if (existing.images.length + files.length > 5)
    throw AppError.conflict('A listing can have at most 5 images');

  const uploaded = await storeImages(files);
  try {
    const doc = await Item.findOneAndUpdate(
      { _id: itemId, createdBy: userId },
      { $push: { images: { $each: uploaded } } },
      { new: true, runValidators: true },
    ).populate('createdBy', 'username');
    if (!doc) throw AppError.forbidden('You can only manage your own listings');
    return toOwnerItem(asPopulated(doc));
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteImage(image.publicId)));
    throw error;
  }
}

export async function removeImage(itemId: string, userId: string, publicId: string): Promise<ItemDto> {
  const existing = await Item.findById(itemId);
  if (!existing) throw AppError.notFound('Listing not found');
  if (existing.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only manage your own listings');

  const image = existing.images.find((entry) => entry.publicId === publicId);
  if (!image) throw AppError.notFound('Image not found on this listing');
  if (existing.images.length <= 1) throw AppError.conflict('A listing must keep at least one image');

  const doc = await Item.findOneAndUpdate(
    { _id: itemId, createdBy: userId },
    { $pull: { images: { publicId } } },
    { new: true },
  ).populate('createdBy', 'username');
  if (!doc) throw AppError.forbidden('You can only manage your own listings');

  await deleteImage(publicId);
  return toOwnerItem(asPopulated(doc));
}
