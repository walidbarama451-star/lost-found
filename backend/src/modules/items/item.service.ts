import type { FilterQuery } from 'mongoose';
import { deleteImage, storeImage } from '../../config/imageStorage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { escapeRegex } from '../../shared/utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { createNotification } from '../notifications/notification.service.js';
import { Claim } from '../claims/claim.model.js';
import { asPopulated, toOwnerItem, toPublicItem, type ItemDto } from './item.dto.js';
import { Item, type ItemRecord, type ItemStatus } from './item.model.js';
import type { CreateItemInput, ListItemsQuery, MyItemsQuery, UpdateItemInput } from './item.schema.js';

interface ItemListResult {
  items: ItemDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

function buildFilter(options: {
  q?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
  status?: ItemStatus;
}): FilterQuery<ItemRecord> {
  const filter: Record<string, unknown> = {};

  if (options.status) filter.status = options.status;
  if (options.q) {
    const pattern = new RegExp(escapeRegex(options.q), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }
  if (options.category) filter.category = options.category;
  if (options.fromDate || options.toDate) {
    const range: Record<string, Date> = {};
    if (options.fromDate) range.$gte = new Date(options.fromDate);
    if (options.toDate) range.$lte = new Date(`${options.toDate}T23:59:59.999Z`);
    filter.dateFound = range;
  }

  return filter as FilterQuery<ItemRecord>;
}

export async function listActiveItems(query: ListItemsQuery): Promise<ItemListResult> {
  const { page, limit } = parsePagination(query);
  const filter = buildFilter({
    q: query.q,
    category: query.category,
    fromDate: query.fromDate,
    toDate: query.toDate,
    status: 'ACTIVE',
  });
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
    items: docs.map((doc) => toPublicItem(asPopulated(doc))),
    pagination: buildPaginationMeta(page, limit, total),
  };
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

async function loadPublicItem(itemId: string) {
  const doc = await Item.findById(itemId).populate('createdBy', 'username');
  if (!doc || doc.status === 'HIDDEN') throw AppError.notFound('Listing not found');
  return doc;
}

export async function getPublicItem(itemId: string): Promise<ItemDto> {
  const doc = await loadPublicItem(itemId);
  return toPublicItem(asPopulated(doc));
}

export async function getOwnerItem(itemId: string, userId: string): Promise<ItemDto> {
  const doc = await loadPublicItem(itemId);
  if (doc.createdBy.toString() !== userId) throw AppError.forbidden('You can only manage your own listings');
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

  const uploaded: { url: string; publicId: string }[] = [];
  try {
    for (const file of files) {
      uploaded.push(await storeImage(file.buffer, file.mimetype));
    }

    const doc = await Item.create({
      title: input.title,
      description: input.description,
      category: input.category,
      dateFound: new Date(`${input.dateFound}T12:00:00.000Z`),
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
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.dateFound !== undefined) set.dateFound = new Date(`${patch.dateFound}T12:00:00.000Z`);
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

  if (doc.acceptedClaim) {
    const claim = await Claim.findById(doc.acceptedClaim);
    if (claim) {
      await createNotification({
        recipient: claim.claimant.toString(),
        type: 'ITEM_RETURNED',
        title: 'Item marked as returned',
        message: `"${doc.title}" has been marked as returned. Thank you for using Lost & Found!`,
        relatedItem: doc._id.toString(),
        relatedClaim: claim._id.toString(),
      });
    }
  }

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

  const uploaded: { url: string; publicId: string }[] = [];
  try {
    for (const file of files) {
      uploaded.push(await storeImage(file.buffer, file.mimetype));
    }
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
