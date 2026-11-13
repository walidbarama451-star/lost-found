import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import type { CreateItemInput, MyItemsQuery, UpdateItemInput } from './item.schema.js';
import {
  addImages,
  deleteItem as deleteItemService,
  createItem,
  getVisibleItem,
  listMyItems,
  markReturned,
  removeImage,
  updateItem,
} from './item.service.js';

function filesOf(req: Request): Express.Multer.File[] {
  return (req.files as Express.Multer.File[] | undefined) ?? [];
}

function requireUser(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as MyItemsQuery;
  const result = await listMyItems(userId, query);
  ok(res, result);
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await getVisibleItem(req.params.itemId as string, userId);
  ok(res, { item });
});

export const postItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await createItem(userId, req.body as CreateItemInput, filesOf(req));
  res.status(201).json({ success: true, data: { item }, message: 'Listing published' });
});

export const patchItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await updateItem(req.params.itemId as string, userId, req.body as UpdateItemInput);
  ok(res, { item }, 'Listing updated');
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  await deleteItemService(req.params.itemId as string, userId);
  ok(res, { deleted: true }, 'Listing deleted');
});

export const patchReturn = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await markReturned(req.params.itemId as string, userId);
  ok(res, { item }, 'Listing marked as returned');
});

export const postImages = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await addImages(req.params.itemId as string, userId, filesOf(req));
  ok(res, { item }, 'Images added');
});

export const deleteImageRoute = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await removeImage(req.params.itemId as string, userId, req.params.publicId as string);
  ok(res, { item }, 'Image removed');
});
