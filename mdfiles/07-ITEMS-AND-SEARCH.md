# 07 — Items and Search

## Create listing

Required:
- title
- at least one valid image

Server must:
- Authenticate the user.
- Validate all fields.
- Validate and upload images.
- Set `createdBy` from authenticated identity.
- Set status to `ACTIVE`.
- Never accept `createdBy` or status from an untrusted client.

## Update listing

- Only owner can update.
- Validate each supplied field.
- Do not allow changing `createdBy`.
- Restrict status changes to explicit lifecycle actions.
- If replacing images, delete old Cloudinary assets only after the database update succeeds, with cleanup/retry handling.

## Delete listing

Prefer soft-close (`CLOSED`) for listings that have claims or a return history. A hard delete can be considered only when no related records exist and retention rules permit it.

## Listing response

Return:
- id
- title
- image URLs
- status
- createdAt
- safe finder display name, if desired

Do not return:
- claimant messages
- private phone/email
- internal Cloudinary credentials
- moderation notes
- full user documents

## Search and visibility

Listings are never publicly browsable. A listing is revealed only when a
lost-report search matches it:

- Photo matches score image embeddings (cosine similarity) against the report's photos.
- When vectors are unavailable, a title-wording text similarity fallback applies.
- Only `ACTIVE` listings participate in matching; the owner always sees their own listings.

Requirements:
- Escape or safely handle user search strings.
- Build MongoDB filters from a whitelist; never pass `req.query` directly into a database query.
- Set pagination maximum.
- Add indexes based on real query patterns.
- Return pagination metadata.
- Provide useful empty results rather than treating no matches as an error.

## Future enhancements

- Geospatial search using coordinates and a 2dsphere index.
- Map-based discovery.
- Saved searches and favorites.
- Report listing functionality.
