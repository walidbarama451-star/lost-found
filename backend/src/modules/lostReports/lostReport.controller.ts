import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import {
  createLostReport,
  deleteLostReport,
  getMyReport,
  listMyReports,
  searchReport,
  updateLostReport,
} from './lostReport.service.js';
import type {
  CreateLostReportInput,
  LostReportsQuery,
  UpdateLostReportInput,
} from './lostReport.schema.js';

function filesOf(req: Request): Express.Multer.File[] {
  return (req.files as Express.Multer.File[] | undefined) ?? [];
}

function requireUser(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export const postLostReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const report = await createLostReport(userId, req.body as CreateLostReportInput, filesOf(req));
  res.status(201).json({ success: true, data: { report }, message: 'Search complete — check your matches below' });
});

export const getMyLostReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as LostReportsQuery;
  const result = await listMyReports(userId, query);
  ok(res, result);
});

export const getLostReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const report = await getMyReport(req.params.reportId as string, userId);
  ok(res, { report });
});

export const postLostReportSearch = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const report = await searchReport(req.params.reportId as string, userId);
  ok(res, { report }, 'Search complete');
});

export const patchLostReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const report = await updateLostReport(
    req.params.reportId as string,
    userId,
    req.body as UpdateLostReportInput,
  );
  ok(res, { report }, 'Lost report updated');
});

export const deleteLostReportRoute = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  await deleteLostReport(req.params.reportId as string, userId);
  ok(res, { deleted: true }, 'Lost report deleted');
});
