# 04 — MongoDB Database Design

Use MongoDB with Mongoose. Define schemas and indexes explicitly.

## 1. User collection

Suggested fields:
- `_id`: ObjectId.
- `username`: string, required, trimmed, length-limited.
- `discordUsername`: string, supplied during registration.
- `email`: string, required, lowercase, unique index.
- `passwordHash`: string, required, never returned by API.
- `phone`: optional string; private.
- `role`: `USER` by default; never user-editable.
- `createdAt`, `updatedAt`: timestamps.

Do not name a field `password` if it stores a hash; use `passwordHash` to make its purpose clear.

## 2. Item collection

Suggested fields:
- `_id`: ObjectId.
- `title`: string, required, length-limited.
- `images`: array of `{ url, publicId }` (plus optional photo embeddings).
- `status`: `ACTIVE | CLAIMED | RETURNED | CLOSED | HIDDEN`.
- `createdBy`: ObjectId reference to User.
- `acceptedClaim`: optional ObjectId reference to Claim.
- `returnedAt`: optional Date.
- `createdAt`, `updatedAt`: timestamps.

Indexes:
- `{ status: 1, createdAt: -1 }`
- `{ createdBy: 1, createdAt: -1 }`

## 3. Claim collection

Suggested fields:
- `_id`: ObjectId.
- `item`: ObjectId reference to Item.
- `claimant`: ObjectId reference to User.
- `message`: private string, required, length-limited.
- `status`: `PENDING | ACCEPTED | REJECTED | WITHDRAWN`.
- `decisionAt`: optional Date.
- `createdAt`, `updatedAt`: timestamps.

Indexes:
- `{ item: 1, claimant: 1, status: 1 }`
- `{ claimant: 1, createdAt: -1 }`
- `{ item: 1, createdAt: -1 }`

Consider a partial unique index for one pending claim per claimant/item pair, or enforce this rule transactionally in the service. Ensure the exact index semantics match the selected MongoDB deployment.

## 4. Lost report collection

Suggested fields:
- `_id`: ObjectId.
- `owner`: ObjectId reference to User.
- `title`: string, required.
- `images`: array of `{ url, publicId }` (plus optional photo embeddings).
- `status`: `OPEN | CLOSED`.
- `matches`: array of `{ item, score, method, matchedAt }`.
- `lastSearchedAt`: optional Date.
- `createdAt`, `updatedAt`: timestamps.

## 5. Relationships

- One User can create many Items.
- One Item can have many Claims.
- One User can submit many Claims.
- A Claim belongs to one Item and one claimant.
- A LostReport belongs to one User and can reference many matched Items.

Use ObjectId references. Populate only fields required for the response. Avoid returning full user documents in public listing results.

## 6. Data integrity

- Validate ObjectId route parameters before querying.
- Check referenced documents exist.
- Check ownership in service functions.
- Prevent more than one accepted claim per item.
- Use a MongoDB transaction where multiple writes must succeed or fail together; transactions require a suitable replica-set deployment.
- If transactions are not available, use atomic conditional updates and carefully designed state transitions.
