import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { searchLimiter, uploadLimiter } from '../../middleware/rateLimit.js';
import { assertImageContent, assertTotalUploadSize, uploadImages } from '../../middleware/upload.js';
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

lostReportsRouter.use(authenticate);

lostReportsRouter.post(
  '/',
  uploadLimiter,
  uploadImages.array('images', 3),
  assertTotalUploadSize,
  assertImageContent,
  validate(createLostReportSchema, 'body'),
  postLostReport,
);
lostReportsRouter.get('/', validate(lostReportsQuerySchema, 'query'), getMyLostReports);
lostReportsRouter.get('/:reportId', getLostReport);
lostReportsRouter.post('/:reportId/search', searchLimiter, postLostReportSearch);
lostReportsRouter.patch('/:reportId', validate(updateLostReportSchema, 'body'), patchLostReport);
lostReportsRouter.delete('/:reportId', deleteLostReportRoute);
