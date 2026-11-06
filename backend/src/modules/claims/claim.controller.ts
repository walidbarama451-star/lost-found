import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ok } from '../../shared/utils/response.js';
import type { CreateClaimInput, DecisionInput } from './claim.schema.js';
import { decideClaim, listClaimsForItem, listMyClaims, submitClaim, withdrawClaim } from './claim.service.js';

function requireUser(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

/** POST /api/claims — submit a private claim. */
export const postClaim = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { itemId, message } = req.body as CreateClaimInput;
  const claim = await submitClaim(userId, itemId, message);
  res.status(201).json({ success: true, data: { claim }, message: 'Claim submitted' });
});

/** GET /api/claims/mine — claims I submitted. */
export const getMyClaims = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as { page?: number; limit?: number };
  const result = await listMyClaims(userId, query);
  ok(res, result);
});

/** GET /api/items/:itemId/claims — claims on one of my listings. */
export const getItemClaims = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const query = (req.validatedQuery ?? {}) as { page?: number; limit?: number };
  const result = await listClaimsForItem(userId, req.params.itemId as string, query);
  ok(res, result);
});

/** PATCH /api/claims/:claimId/decision — owner accepts/rejects. */
export const patchDecision = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { decision } = req.body as DecisionInput;
  const claim = await decideClaim(userId, req.params.claimId as string, decision);
  ok(res, { claim }, decision === 'ACCEPTED' ? 'Claim accepted' : 'Claim rejected');
});

/** PATCH /api/claims/:claimId/withdraw — claimant withdraws. */
export const patchWithdraw = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const claim = await withdrawClaim(userId, req.params.claimId as string);
  ok(res, { claim }, 'Claim withdrawn');
});
