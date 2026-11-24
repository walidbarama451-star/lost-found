import type { FilterQuery } from 'mongoose';
import { deleteImage } from '../../config/imageStorage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { storeImagesWithEmbeddings } from '../../shared/utils/storeImagesWithEmbeddings.js';
import { invalidateCandidatePool } from '../lostReports/lostReport.service.js';
import { LostReport } from '../lostReports/lostReport.model.js';
import { Claim } from '../claims/claim.model.js';
import { asPopulated, toOwnerItem, toPublicItem, type ItemDto } from './item.dto.js';
import { Item, type ItemDoc, type ItemRecord } from './item.model.js';
import type { CreateItemInput, MyItemsQuery, UpdateItemInput } from './item.schema.js';

interface ItemListResult {
  items: ItemDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
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

  const uploaded = await storeImagesWithEmbeddings(files);
  try {
    const doc = await Item.create({
      title: input.title,
      images: uploaded,
      createdBy: userId,
      status: 'ACTIVE',
    });

    await doc.populate('createdBy', 'username');
    invalidateCandidatePool();
    return toOwnerItem(asPopulated(doc));
  } catch (error) {
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

  invalidateCandidatePool();
  return toOwnerItem(asPopulated(doc));
}

export async function deleteItem(itemId: string, userId: string): Promise<void> {
  const doc = await Item.findOneAndDelete({ _id: itemId, createdBy: userId });
  if (!doc) {
    const existing = await Item.findById(itemId);
    if (!existing) throw AppError.notFound('Listing not found');
    throw AppError.forbidden('You can only manage your own listings');
  }

  await Promise.all([
    LostReport.updateMany({ 'matches.item': doc._id }, { $pull: { matches: { item: doc._id } } }),
    Claim.deleteMany({ item: doc._id }),
  ]);

  await Promise.all(doc.images.map((image) => deleteImage(image.publicId)));
  invalidateCandidatePool();
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

  invalidateCandidatePool();
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

  const uploaded = await storeImagesWithEmbeddings(files);
  try {
    const doc = await Item.findOneAndUpdate(
      { _id: itemId, createdBy: userId },
      { $push: { images: { $each: uploaded } } },
      { new: true, runValidators: true },
    ).populate('createdBy', 'username');
    if (!doc) throw AppError.forbidden('You can only manage your own listings');
    invalidateCandidatePool();
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
  invalidateCandidatePool();
  return toOwnerItem(asPopulated(doc));
}
