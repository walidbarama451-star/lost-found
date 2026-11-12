import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { assertImageContent, uploadImages } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import {
  deleteLostReportRoute,
  getLostReport,
  getMyLostReports,
  patchLostReport,
  postLostReport,
  postLostReportSearch,
} from './lostReport.controller.js';
import {
  createLostReportSchema,
  lostReportsQuerySchema,
  updateLostReportSchema,
} from './lostReport.schema.js';

export const lostReportsRouter = Router();

// Everything below requires a signed-in user: found items are never shown
// publicly, only to people actively searching for their lost belongings.
lostReportsRouter.use(authenticate);

lostReportsRouter.post(
  '/',
  uploadLimiter,
  uploadImages.array('images', 3),
  assertImageContent,
  validate(createLostReportSchema, 'body'),
  postLostReport,
);
lostReportsRouter.get('/', validate(lostReportsQuerySchema, 'query'), getMyLostReports);
lostReportsRouter.get('/:reportId', getLostReport);
lostReportsRouter.post('/:reportId/search', postLostReportSearch);
lostReportsRouter.patch('/:reportId', validate(updateLostReportSchema, 'body'), patchLostReport);
lostReportsRouter.delete('/:reportId', deleteLostReportRoute);
