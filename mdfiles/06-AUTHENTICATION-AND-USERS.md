# 06 — Authentication and Users

## Registration rules

- Username: 3–30 characters; trim whitespace.
- Email: valid email; trim and lowercase.
- Password: minimum 8 characters; encourage longer passphrases.
- Reject duplicate email with `409 Conflict`.
- Hash passwords with bcrypt or bcryptjs using a suitable cost factor.
- Never log passwords or return password hashes.

## Login rules

- Normalize email before lookup.
- Use a generic “Invalid email or password” error to avoid account enumeration.
- Compare submitted password with stored hash.
- Apply rate limiting to login and registration endpoints.
- Return only safe user fields.

## Token strategy

For a simple learning MVP, use short-lived JWT access tokens. For a production browser application, prefer a carefully designed refresh-token strategy with rotation and revocation. Store browser session credentials in secure, HttpOnly, SameSite cookies where practical; avoid persistent localStorage token storage for sensitive production sessions.

JWT requirements:
- Secret stored only in environment variables.
- Short expiration.
- Verify signature and expiration on every protected request.
- Validate expected issuer/audience if configured.
- Do not put sensitive personal data in token payloads.
- Derive user identity from the verified token, never from request body fields.

## Authorization

- Authentication answers “who is making this request?”
- Authorization answers “is this user allowed to do this?”

Enforce authorization in backend services:
- Users can edit only their own profile.
- Users can edit/delete only their own items.
- Only the item owner can review claims for that item.
- Only the claimant can withdraw their own pending claim.
- Users can read and mark read only their own notifications.

## Profile response

Safe profile fields:
- id
- username
- email
- createdAt

Do not return:
- passwordHash
- JWT secret
- refresh-token hashes
- internal moderation notes
- private contact details unless the feature and consent explicitly require it.

## Account lifecycle

Plan future support for:
- Email verification.
- Password reset using single-use, expiring tokens.
- Account deletion and data-retention policy.
- Session revocation.
