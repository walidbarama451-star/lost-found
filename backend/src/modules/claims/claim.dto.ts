import type { Types } from 'mongoose';
import type { ClaimStatus } from './claim.model.js';

export interface ClaimDto {
  id: string;
  status: ClaimStatus;
  message: string;
  createdAt: string;
  decisionAt: string | null;
}

export interface ClaimOnItemDto extends ClaimDto {
  claimant: { id: string; username: string };
}

type ClaimantRef = Types.ObjectId | { _id: Types.ObjectId; username: string };
type ItemRef =
  Types.ObjectId | { _id: Types.ObjectId; title: string; status: string; images: { url: string }[] };

export interface PopulatedClaim {
  _id: Types.ObjectId;
  item: ItemRef;
  claimant: ClaimantRef;
  message: string;
  status: ClaimStatus;
  decisionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function baseDto(claim: PopulatedClaim): ClaimDto {
  return {
    id: claim._id.toString(),
    status: claim.status,
    message: claim.message,
    createdAt: claim.createdAt.toISOString(),
    decisionAt: claim.decisionAt ? claim.decisionAt.toISOString() : null,
  };
}

export function toClaimOnItemDto(claim: PopulatedClaim): ClaimOnItemDto {
  const claimantRef = claim.claimant as { _id: Types.ObjectId; username: string };
  const claimant =
    claimantRef && typeof claimantRef === 'object' && 'username' in claimantRef
      ? { id: claimantRef._id.toString(), username: claimantRef.username }
      : { id: String(claim.claimant), username: 'Unknown user' };
  return { ...baseDto(claim), claimant };
}
