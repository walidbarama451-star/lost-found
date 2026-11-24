import { Types as ObjectIdTypes } from 'mongoose';
import { env } from '../../config/env.js';
import { deleteImage } from '../../config/imageStorage.js';
import type { ItemDoc } from '../items/item.model.js';
import { Item } from '../items/item.model.js';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { normalizeIfNeeded } from '../../shared/utils/similarity.js';
import { storeImagesWithEmbeddings } from '../../shared/utils/storeImagesWithEmbeddings.js';
import { computeMatches, type MatchCandidate } from './matcher.js';
import { LostReport, type LostReportDoc } from './lostReport.model.js';
import { toLostReportDto, type LostReportDto } from './lostReport.dto.js';
import type {
  CreateLostReportInput,
  LostReportsQuery,
  UpdateLostReportInput,
} from './lostReport.schema.js';

const MAX_MATCHES_STORED = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const CANDIDATE_CACHE_TTL_MS = 60_000;

export interface CachedCandidate {
  itemId: string;
  ownerId: string;
  title: string;
  createdAt: Date;
  imageEmbeddings: readonly (readonly number[])[];
}

let cachedCandidatePool: { loadedAt: number; candidates: CachedCandidate[] } | null = null;

export function invalidateCandidatePool(): void {
  cachedCandidatePool = null;
}

export function getCandidatePoolCacheStatus(): { loadedAt: number; count: number } | null {
  return cachedCandidatePool
    ? { loadedAt: cachedCandidatePool.loadedAt, count: cachedCandidatePool.candidates.length }
    : null;
}

interface LostReportListResult {
  reports: LostReportDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

function loadOwnedReport(reportId: string, userId: string): Promise<LostReportDoc | null> {
  return LostReport.findOne({ _id: reportId, owner: userId }).select('+images.embedding');
}

async function loadCandidatePool(): Promise<CachedCandidate[]> {
  const now = Date.now();
  if (cachedCandidatePool && now - cachedCandidatePool.loadedAt < CANDIDATE_CACHE_TTL_MS) {
    return cachedCandidatePool.candidates;
  }

  const docs = (await Item.find({ status: 'ACTIVE' })
    .select('+images.embedding _id createdBy title createdAt')
    .sort({ createdAt: -1 })
    .limit(env.matchCandidateLimit)
    .lean()) as unknown as Array<{
      _id: ObjectIdTypes.ObjectId;
      createdBy: ObjectIdTypes.ObjectId | string;
      title: string;
      images: { embedding?: number[] }[];
      createdAt: Date;
    }>;

  // Stored embeddings are already normalized on upload/backfill; skip redundant normalizeIfNeeded pass
  const candidates: CachedCandidate[] = docs.map((doc) => ({
    itemId: doc._id.toString(),
    ownerId: String(doc.createdBy),
    title: doc.title,
    createdAt: new Date(doc.createdAt),
    imageEmbeddings: doc.images
      .map((image) => image.embedding)
      .filter((vector): vector is number[] => Array.isArray(vector) && vector.length > 0),
  }));

  cachedCandidatePool = { loadedAt: now, candidates };
  return candidates;
}

async function loadCandidates(ownerId: string): Promise<MatchCandidate[]> {
  const pool = await loadCandidatePool();
  const lookbackDays = env.matchLookbackDays;
  const cutoff = lookbackDays > 0 ? Date.now() - lookbackDays * DAY_MS : 0;

  return pool
    .filter((candidate) => candidate.ownerId !== ownerId && (cutoff === 0 || candidate.createdAt.getTime() >= cutoff))
    .map((candidate) => ({
      itemId: candidate.itemId,
      title: candidate.title,
      imageEmbeddings: candidate.imageEmbeddings,
    }));
}

async function runSearch(report: LostReportDoc): Promise<LostReportDoc> {
  const reportEmbeddings = report.images
    .map((image) => image.embedding)
    .filter((vector): vector is number[] => Array.isArray(vector) && vector.length > 0)
    .map((vector) => normalizeIfNeeded(vector));

  const candidates = await loadCandidates(String(report.owner));

  const matches = computeMatches(report.title, reportEmbeddings, candidates);

  report.matches = matches.map((match) => ({
    item: new ObjectIdTypes.ObjectId(match.itemId),
    score: match.score,
    method: match.method,
    matchedAt: new Date(),
  }));
  report.lastSearchedAt = new Date();
  if (report.matches.length > MAX_MATCHES_STORED) {
    report.matches.length = MAX_MATCHES_STORED;
  }
  await report.save();
  return report;
}

async function loadMatchedItems(report: LostReportDoc): Promise<ItemDoc[]> {
  const ids = report.matches.map((match) => match.item);
  if (ids.length === 0) return [];
  const docs = await Item.find({ _id: { $in: ids } }).populate('createdBy', 'username');
  return docs as ItemDoc[];
}

export async function createLostReport(
  userId: string,
  input: CreateLostReportInput,
  files: Express.Multer.File[],
): Promise<LostReportDto> {
  if (files.length === 0) {
    throw AppError.badRequest('At least one photo of your lost item is required');
  }

  const uploaded = await storeImagesWithEmbeddings(files);
  try {
    const report = await LostReport.create({
      owner: userId,
      title: input.title,
      images: uploaded,
      status: 'OPEN',
    });

    const searched = await runSearch(report);
    const itemDocs = await loadMatchedItems(searched);
    return toLostReportDto(searched, itemDocs);
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteImage(image.publicId)));
    throw error;
  }
}

export async function listMyReports(userId: string, query: LostReportsQuery): Promise<LostReportListResult> {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = { owner: userId };
  if (query.status) filter.status = query.status;

  const [docs, total] = await Promise.all([
    LostReport.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    LostReport.countDocuments(filter),
  ]);

  const itemIds = new Set(
    docs.flatMap((report) => report.matches.map((match) => match.item.toString())),
  );
  const itemDocs =
    itemIds.size > 0
      ? ((await Item.find({ _id: { $in: [...itemIds] } }).populate('createdBy', 'username')) as ItemDoc[])
      : [];

  return {
    reports: docs.map((report) => toLostReportDto(report, itemDocs)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getMyReport(reportId: string, userId: string): Promise<LostReportDto> {
  const report = await loadOwnedReport(reportId, userId);
  if (!report) throw AppError.notFound('Lost report not found');

  const itemDocs = await loadMatchedItems(report);
  return toLostReportDto(report, itemDocs);
}

export async function searchReport(reportId: string, userId: string): Promise<LostReportDto> {
  const report = await loadOwnedReport(reportId, userId);
  if (!report) throw AppError.notFound('Lost report not found');

  const searched = await runSearch(report);
  const itemDocs = await loadMatchedItems(searched);
  return toLostReportDto(searched, itemDocs);
}

export async function updateLostReport(
  reportId: string,
  userId: string,
  patch: UpdateLostReportInput,
): Promise<LostReportDto> {
  const existing = await loadOwnedReport(reportId, userId);
  if (!existing) throw AppError.notFound('Lost report not found');

  const set: Record<string, unknown> = {};
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.status !== undefined) set.status = patch.status;

  if (Object.keys(set).length === 0) throw AppError.badRequest('Provide at least one field to update');

  const doc = await LostReport.findOneAndUpdate(
    { _id: reportId, owner: userId },
    { $set: set },
    { new: true, runValidators: true },
  );
  if (!doc) throw AppError.notFound('Lost report not found');

  const itemDocs = await loadMatchedItems(doc);
  return toLostReportDto(doc, itemDocs);
}

export async function deleteLostReport(reportId: string, userId: string): Promise<void> {
  const existing = await loadOwnedReport(reportId, userId);
  if (!existing) throw AppError.notFound('Lost report not found');

  await LostReport.deleteOne({ _id: reportId, owner: userId });
  await Promise.all(existing.images.map((image) => deleteImage(image.publicId)));
}
