# 08 — Claims and Safe Recovery

## Purpose

A claim lets a person privately explain why they believe a found item belongs to them.

## Claim submission

Required:
- itemId
- private message explaining identifying details

Backend checks:
1. User is authenticated.
2. Item exists.
3. Item status is `ACTIVE`.
4. Claimant is not the item owner.
5. No existing pending claim from this claimant for this item.
6. Message passes length and content validation.

## Claim privacy

- Claim message is visible only to the claimant and item owner.
- Never include claim message in public item API results.
- Do not show private proof details publicly; the claim message stays between claimant and listing owner.
- Avoid requesting unnecessary sensitive information.

## Review

Only the owner of the item can accept or reject a pending claim.

Use a service-layer state transition:
- Load claim and associated item.
- Verify current user owns item.
- Verify claim is still `PENDING`.
- If accepting, ensure item is still `ACTIVE` and has no accepted claim.
- Update claim and item consistently.
- Notify claimant.

For concurrent decisions, use a transaction on a replica-set deployment or an atomic conditional update. A plain sequence of independent reads and writes can allow race conditions.

## Return process

Acceptance means the owner believes the claimant has provided sufficient proof; it does not automatically prove identity. Users should arrange a safe public handover and avoid publishing home addresses or sensitive contact information.

After handover, owner marks item `RETURNED`. Record `returnedAt`.

## Abuse prevention

- Rate-limit claim creation.
- Allow users to report suspicious claims/listings in a later moderation phase.
- Provide clear guidance not to share passwords, bank details, or identity documents.
- Do not guarantee ownership based solely on a written claim.
