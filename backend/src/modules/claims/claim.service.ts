import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { Item } from '../items/item.model.js';
import { invalidateCandidatePool } from '../lostReports/lostReport.service.js';
import { toClaimOnItemDto, toMyClaimDto, type ClaimOnItemDto, type MyClaimDto } from './claim.dto.js';
import { Claim, type ClaimDoc, type ClaimRecord } from './claim.model.js';

interface ClaimListResult<T> {
  items: T[];
  pagination: ReturnType<typeof buildPaginationMeta>;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

export async function submitClaim(userId: string, itemId: string, message: string): Promise<ClaimOnItemDto> {
  const item = await Item.findById(itemId);
  if (!item) throw AppError.notFound('Listing not found');
  if (item.status !== 'ACTIVE') throw AppError.conflict('This listing is not accepting claims');
  if (item.createdBy.toString() === userId) throw AppError.forbidden('You cannot claim your own listing');

  const existing = await Claim.findOne({ item: item._id, claimant: userId, status: 'PENDING' });
  if (existing) throw AppError.conflict('You already have a pending claim on this listing');

  let claim: ClaimDoc;
  try {
    claim = await Claim.create({ item: item._id, claimant: userId, message });
  } catch (error) {
    if (isDuplicateKey(error)) throw AppError.conflict('You already have a pending claim on this listing');
    throw error;
  }

  await claim.populate('claimant', 'username');
  return toClaimOnItemDto(claim as unknown as Parameters<typeof toClaimOnItemDto>[0]);
}

export async function listMyClaims(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<ClaimListResult<MyClaimDto>> {
  const { page, limit } = parsePagination(query);
  const filter = { claimant: new Types.ObjectId(userId) };

  const [docs, total] = await Promise.all([
    Claim.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('item', 'title status images'),
    Claim.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toMyClaimDto(doc as unknown as Parameters<typeof toMyClaimDto>[0])),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function listClaimsForItem(
  userId: string,
  itemId: string,
  query: { page?: number; limit?: number },
): Promise<ClaimListResult<ClaimOnItemDto>> {
  const item = await Item.findById(itemId);
  if (!item) throw AppError.notFound('Listing not found');
  if (item.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only review claims on your own listings');

  const { page, limit } = parsePagination(query);
  const filter = { item: item._id };

  const [docs, total] = await Promise.all([
    Claim.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('claimant', 'username'),
    Claim.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => toClaimOnItemDto(doc as unknown as Parameters<typeof toClaimOnItemDto>[0])),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function loadClaimOwnedBy(claimId: string, userId: string): Promise<ClaimRecord> {
  const claim = await Claim.findById(claimId);
  if (!claim) throw AppError.notFound('Claim not found');

  const item = await Item.findById(claim.item);
  if (!item) throw AppError.notFound('Listing not found');
  if (item.createdBy.toString() !== userId)
    throw AppError.forbidden('You can only review claims on your own listings');
  if (claim.status !== 'PENDING') throw AppError.conflict('This claim has already been decided');

  return claim;
}
export async function decideClaim(
  userId: string,
  claimId: string,
  decision: 'ACCEPTED' | 'REJECTED',
): Promise<{ id: string; status: string }> {
  const claim = await loadClaimOwnedBy(claimId, userId);

  if (decision === 'REJECTED') {
    const updated = await Claim.findOneAndUpdate(
      { _id: claim._id, status: 'PENDING' },
      { $set: { status: 'REJECTED', decisionAt: new Date() } },
      { new: true },
    );
    if (!updated) throw AppError.conflict('This claim has already been decided');

    return { id: updated._id.toString(), status: updated.status };
  }

  const accepted = await Claim.findOneAndUpdate(
    { _id: claim._id, status: 'PENDING' },
    { $set: { status: 'ACCEPTED', decisionAt: new Date() } },
    { new: true },
  );
  if (!accepted) throw AppError.conflict('This claim has already been decided');

  const updatedItem = await Item.findOneAndUpdate(
    { _id: claim.item, status: 'ACTIVE', acceptedClaim: null },
    { $set: { status: 'CLAIMED', acceptedClaim: accepted._id } },
    { new: true },
  );

  if (!updatedItem) {
    await Claim.updateOne(
      { _id: accepted._id, status: 'ACCEPTED' },
      { $set: { status: 'PENDING', decisionAt: null } },
    );
    throw AppError.conflict('This listing can no longer be claimed');
  }

  invalidateCandidatePool();

  return { id: accepted._id.toString(), status: accepted.status };
}

export async function withdrawClaim(
  userId: string,
  claimId: string,
): Promise<{ id: string; status: string }> {
  const updated = await Claim.findOneAndUpdate(
    { _id: claimId, claimant: userId, status: 'PENDING' },
    { $set: { status: 'WITHDRAWN', decisionAt: new Date() } },
    { new: true },
  );

  if (!updated) {
    const existing = await Claim.findById(claimId);
    if (!existing) throw AppError.notFound('Claim not found');
    if (existing.claimant.toString() !== userId)
      throw AppError.forbidden('You can only withdraw your own claims');
    throw AppError.conflict('Only pending claims can be withdrawn');
  }

  return { id: updated._id.toString(), status: updated.status };
}
