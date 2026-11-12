import { Types as ObjectIdTypes } from 'mongoose';
import type { ItemDoc } from '../items/item.model.js';
import { Item } from '../items/item.model.js';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { deleteImage, storeImage } from '../../config/imageStorage.js';
import { embedImage } from '../../config/imageEmbedding.js';
import { computeMatches, type MatchCandidate } from './matcher.js';
import { LostReport, type LostReportDoc } from './lostReport.model.js';
import { toLostReportDto, type LostReportDto } from './lostReport.dto.js';
import type {
  CreateLostReportInput,
  LostReportsQuery,
  UpdateLostReportInput,
} from './lostReport.schema.js';

const MAX_MATCHES_STORED = 50;

interface LostReportListResult {
  reports: LostReportDto[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

function loadOwnedReport(reportId: string, userId: string): Promise<LostReportDoc | null> {
  // Embeddings are excluded by default; re-running the photo search needs them.
  return LostReport.findOne({ _id: reportId, owner: userId }).select('+images.embedding');
}

/** Stores the uploaded photos and attaches embeddings when the service is up. */
async function storePhotos(
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

/** Loads every ACTIVE item (except the searcher's own) with photo vectors. */
async function loadCandidates(ownerId: string): Promise<{ docs: ItemDoc[]; candidates: MatchCandidate[] }> {
  const docs = (await Item.find({ status: 'ACTIVE', createdBy: { $ne: ownerId } }).select(
    '+images.embedding',
  )) as ItemDoc[];

  const candidates: MatchCandidate[] = docs.map((doc) => ({
    itemId: doc._id.toString(),
    title: doc.title,
    imageEmbeddings: doc.images
      .map((image) => image.embedding)
      .filter((vector): vector is number[] => Array.isArray(vector) && vector.length > 0),
  }));

  return { docs, candidates };
}

/**
 * Runs the photo search for a report: scores every active found item against
 * the report's photos and persists the matches above the similarity threshold.
 */
async function runSearch(report: LostReportDoc): Promise<LostReportDoc> {
  const { docs, candidates } = await loadCandidates(String(report.owner));

  const reportEmbeddings = report.images
    .map((image) => image.embedding)
    .filter((vector): vector is number[] => Array.isArray(vector) && vector.length > 0);

  const matches = computeMatches(
    report.title,
    reportEmbeddings,
    candidates,
  );

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

/** Loads the live item documents for a report's stored matches. */
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

  const uploaded = await storePhotos(files);
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
    // Report creation failed after upload — clean up the orphaned assets.
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

/** Re-runs the photo search so newly published found items can appear. */
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
