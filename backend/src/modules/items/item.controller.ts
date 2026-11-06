import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import type { CreateItemInput, ListItemsQuery, MyItemsQuery, UpdateItemInput } from './item.schema.js';
import {
  addImages,
  closeItem,
  createItem,
  getPublicItem,
  listActiveItems,
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

/** GET /api/items — public browse & search (ACTIVE only). */
export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.validatedQuery ?? {}) as ListItemsQuery;
  const result = await listActiveItems(query);
  ok(res, result);
});

/** GET /api/items/mine — the current user's listings. */
export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as MyItemsQuery;
  const result = await listMyItems(userId, query);
  ok(res, result);
});

/** GET /api/items/:itemId — public listing detail. */
export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await getPublicItem(req.params.itemId as string);
  ok(res, { item });
});

/** POST /api/items — create a listing with one or more images. */
export const postItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await createItem(userId, req.body as CreateItemInput, filesOf(req));
  res.status(201).json({ success: true, data: { item }, message: 'Listing published' });
});

/** PATCH /api/items/:itemId — owner-only field update. */
export const patchItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await updateItem(req.params.itemId as string, userId, req.body as UpdateItemInput);
  ok(res, { item }, 'Listing updated');
});

/** DELETE /api/items/:itemId — owner-only soft close. */
export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await closeItem(req.params.itemId as string, userId);
  ok(res, { item }, 'Listing closed');
});

/** PATCH /api/items/:itemId/return — owner marks item returned. */
export const patchReturn = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await markReturned(req.params.itemId as string, userId);
  ok(res, { item }, 'Listing marked as returned');
});

/** POST /api/items/:itemId/images — owner adds images. */
export const postImages = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await addImages(req.params.itemId as string, userId, filesOf(req));
  ok(res, { item }, 'Images added');
});

/** DELETE /api/items/:itemId/images/:publicId — owner removes one image. */
export const deleteImageRoute = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const item = await removeImage(req.params.itemId as string, userId, req.params.publicId as string);
  ok(res, { item }, 'Image removed');
});
