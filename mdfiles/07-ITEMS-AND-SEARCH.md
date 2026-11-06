# 07 — Items and Search

## Item categories

Start with a controlled category list, for example:
- ELECTRONICS
- DOCUMENTS
- KEYS
- BAGS
- ACCESSORIES
- CLOTHING
- JEWELRY
- PETS
- OTHER

Keep category values stable in the API. Display localized labels in the frontend if needed.

## Create listing

Required:
- title
- description
- category
- location (approximate)
- dateFound
- at least one valid image, if the MVP requires photos

Server must:
- Authenticate the user.
- Validate all fields.
- Validate date and reject unreasonable future dates.
- Validate category against allowed values.
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

## Public listing response

Return:
- id
- title
- description
- category
- image URLs
- approximate location
- dateFound
- status
- createdAt
- safe finder display name, if desired

Do not return:
- claimant messages
- private phone/email
- internal Cloudinary credentials
- moderation notes
- full user documents

## Search and filters

Supported query parameters:
- `q`: text search.
- `category`: exact category.
- `city`: city label.
- `fromDate`, `toDate`: date range.
- `page`, `limit`: pagination.
- `sort`: `newest` or `oldest`.

Requirements:
- Only show `ACTIVE` listings in normal public browse results.
- Escape or safely handle user search strings.
- Build MongoDB filters from a whitelist; never pass `req.query` directly into a database query.
- Set pagination maximum.
- Add indexes based on real query patterns.
- Return pagination metadata.
- Provide useful empty results rather than treating no matches as an error.

## Future enhancements

- Geospatial search using coordinates and a 2dsphere index.
- Map-based discovery.
- Similar-image matching.
- Saved searches and favorites.
- Report listing functionality.
