# 04 — MongoDB Database Design

Use MongoDB with Mongoose. Define schemas and indexes explicitly.

## 1. User collection

Suggested fields:
- `_id`: ObjectId.
- `username`: string, required, trimmed, length-limited.
- `email`: string, required, lowercase, unique index.
- `passwordHash`: string, required, never returned by API.
- `phone`: optional string; private.
- `avatarUrl`: optional string.
- `role`: `USER` by default; never user-editable.
- `createdAt`, `updatedAt`: timestamps.

Do not name a field `password` if it stores a hash; use `passwordHash` to make its purpose clear.

## 2. Item collection

Suggested fields:
- `_id`: ObjectId.
- `title`: string, required, length-limited.
- `description`: string, required, length-limited.
- `category`: enum/string from a maintained category list.
- `images`: array of `{ url, publicId }`.
- `location`: structured approximate location, e.g. `{ label, city, region, country }`; do not require a private home address.
- `dateFound`: Date.
- `status`: `ACTIVE | CLAIMED | RETURNED | CLOSED | HIDDEN`.
- `createdBy`: ObjectId reference to User.
- `acceptedClaim`: optional ObjectId reference to Claim.
- `returnedAt`: optional Date.
- `createdAt`, `updatedAt`: timestamps.

Indexes:
- `{ status: 1, createdAt: -1 }`
- `{ category: 1, status: 1, createdAt: -1 }`
- `{ createdBy: 1, createdAt: -1 }`
- Text index on suitable title/description fields if MongoDB text search is used.

Avoid creating duplicate text indexes. Choose one search strategy and document its limitations.

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

## 4. Notification collection

Suggested fields:
- `_id`: ObjectId.
- `recipient`: ObjectId reference to User.
- `type`: enum such as `CLAIM_SUBMITTED`, `CLAIM_ACCEPTED`, `CLAIM_REJECTED`, `ITEM_RETURNED`.
- `title`: string.
- `message`: string.
- `relatedItem`: optional ObjectId.
- `relatedClaim`: optional ObjectId.
- `readAt`: optional Date.
- `createdAt`: Date.

Indexes:
- `{ recipient: 1, createdAt: -1 }`
- `{ recipient: 1, readAt: 1 }`

## 5. Relationships

- One User can create many Items.
- One Item can have many Claims.
- One User can submit many Claims.
- One User can receive many Notifications.
- A Claim belongs to one Item and one claimant.

Use ObjectId references. Populate only fields required for the response. Avoid returning full user documents in public listing results.

## 6. Data integrity

- Validate ObjectId route parameters before querying.
- Check referenced documents exist.
- Check ownership in service functions.
- Prevent more than one accepted claim per item.
- Use a MongoDB transaction where multiple writes must succeed or fail together; transactions require a suitable replica-set deployment.
- If transactions are not available, use atomic conditional updates and carefully designed state transitions.
