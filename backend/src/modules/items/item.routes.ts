import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { assertImageContent, assertTotalUploadSize, uploadImages } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { getItemClaims } from '../claims/claim.controller.js';
import {
  deleteImageRoute,
  deleteItem,
  getItem,
  listMine,
  patchItem,
  patchReturn,
  postImages,
  postItem,
} from './item.controller.js';
import {
  createItemSchema,
  myItemsQuerySchema,
  updateItemSchema,
} from './item.schema.js';

export const itemsRouter = Router();

itemsRouter.get('/mine', authenticate, validate(myItemsQuerySchema, 'query'), listMine);
itemsRouter.get('/:itemId/claims', authenticate, getItemClaims);
itemsRouter.get('/:itemId', authenticate, getItem);

itemsRouter.post(
  '/',
  authenticate,
  uploadLimiter,
  uploadImages.array('images', 5),
  assertTotalUploadSize,
  assertImageContent,
  validate(createItemSchema, 'body'),
  postItem,
);

itemsRouter.patch('/:itemId', authenticate, validate(updateItemSchema, 'body'), patchItem);
itemsRouter.delete('/:itemId', authenticate, deleteItem);
itemsRouter.patch('/:itemId/return', authenticate, patchReturn);

itemsRouter.post(
  '/:itemId/images',
  authenticate,
  uploadLimiter,
  uploadImages.array('images', 5),
  assertTotalUploadSize,
  assertImageContent,
  postImages,
);
itemsRouter.delete('/:itemId/images/:publicId', authenticate, deleteImageRoute);
