# 02 — User Flows and Business Rules

## Flow A: Registration and sign-in

1. Guest opens the registration page.
2. Enters username, email, and password.
3. Frontend performs basic validation.
4. Backend validates again, checks email uniqueness, hashes password, and creates user.
5. Backend returns safe user data and an authentication credential.
6. Frontend stores credentials according to the security design and redirects to the application.

Sign-in follows the same pattern but verifies the password hash.

## Flow B: Publish a found item

1. Signed-in user opens the create-listing page.
2. Enters title, description, category, approximate location, and date found.
3. Selects one or more photos.
4. Frontend checks file size/type for usability; backend performs authoritative validation.
5. Backend uploads files to Cloudinary and stores their URLs and public IDs with the listing.
6. Backend creates the listing with status `ACTIVE`.
7. Listing appears in public browse/search results.

If listing creation fails after image upload, clean up uploaded assets where possible.

## Flow C: Search for a lost item

1. User opens browse page.
2. Enters keywords or chooses filters.
3. Frontend sends query parameters to the API.
4. Backend validates filters, applies pagination, and returns public listing fields only.
5. User opens a listing detail page.

Do not expose private claimant information or internal moderation fields in public listing responses.

## Flow D: Submit a claim

1. Signed-in user opens an active listing they do not own.
2. Selects “I think this is mine”.
3. Provides a private explanation and optional proof details.
4. Backend validates ownership rules and duplicate pending claims.
5. Backend creates a `PENDING` claim.
6. Listing owner receives an in-app notification.

Never require a claimant to publish serial numbers, identifying marks, or other proof publicly.

## Flow E: Review a claim

1. Listing owner opens claims for one of their listings.
2. Owner reviews private claim details.
3. Owner accepts or rejects the claim.
4. Backend checks that the current user owns the listing and the claim is still pending.
5. Backend updates the claim and sends a notification to the claimant.
6. If accepted, the listing becomes `CLAIMED` or `RETURN_PENDING`, according to the chosen lifecycle.

## Flow F: Complete the return

1. Owner and claimant arrange a safe handover without publicly exposing personal contact details.
2. Owner marks the listing as `RETURNED`.
3. Backend records returned status and timestamp.
4. Listing is removed from normal active search results.

## Listing status lifecycle

- `ACTIVE`: available for discovery and claims.
- `CLAIMED`: a claim has been accepted; handover is being arranged.
- `RETURNED`: item has been returned.
- `CLOSED`: listing is closed without a completed return.
- `HIDDEN`: removed from public view by moderation or owner action, if supported.

## Claim status lifecycle

- `PENDING`: awaiting owner review.
- `ACCEPTED`: owner accepted the claim.
- `REJECTED`: owner rejected the claim.
- `WITHDRAWN`: claimant withdrew the claim, if this feature is implemented.

## Business rules

- A user cannot claim their own item.
- Only the listing owner can update or delete their listing.
- Only the listing owner can accept or reject claims for that listing.
- Only pending claims can be accepted or rejected.
- A listing can have at most one accepted claim.
- A returned or closed listing cannot receive new claims.
- Claim details are private to the claimant and listing owner.
- Public listing responses must not include private contact or proof information.
- Every authorization decision is enforced by the backend, not only by hiding frontend controls.
