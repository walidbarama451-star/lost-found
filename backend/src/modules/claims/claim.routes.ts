import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { claimLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { patchDecision, postClaim } from './claim.controller.js';
import { createClaimSchema, decisionSchema } from './claim.schema.js';

export const claimsRouter = Router();

claimsRouter.post('/', authenticate, claimLimiter, validate(createClaimSchema, 'body'), postClaim);
claimsRouter.patch('/:claimId/decision', authenticate, validate(decisionSchema, 'body'), patchDecision);
