# 01 — Product Requirements

## 1. Problem

People often find belongings but do not know how to return them. People who lose belongings have difficulty discovering whether someone has found them. This application provides a shared, searchable place for found-item reports and a controlled claim process.

## 2. Goals

- Make it easy to publish a found item.
- Make it easy to search listings.
- Provide a safe process for an owner to claim an item.
- Protect users' personal information and prevent fraudulent claims.
- Make the interface usable on desktop and mobile browsers.

## 3. User roles

### Guest
- View public found-item listings.
- Search and filter listings.
- Open a listing's public details.
- Register or sign in to submit a claim or publish an item.

### Registered user
- Manage their own profile.
- Create, update, and remove their own listings, subject to status rules.
- Submit claims on listings.
- View claims they submitted.
- Review claims on their own listings.

### Administrator — later phase
- Review reports of abusive or fraudulent content.
- Hide inappropriate listings.
- Suspend accounts according to a documented moderation policy.
- View audit information needed for moderation.

Do not implement an administrator role until normal user permissions are working.

## 4. Functional requirements

### Authentication
- Register with username, Discord username, email, and password.
- Validate all input on the server.
- Normalize email to lowercase.
- Hash passwords; never store plaintext passwords.
- Sign in with email and password.
- Retrieve the current user's profile.
- Sign out by clearing the client-side token. If refresh-token or server-side revocation is later introduced, implement it explicitly.

### Profiles
- View and update permitted profile fields.
- Never allow users to change their role through profile updates.
- Never return password hashes or secrets from API responses.

### Found-item listings
A listing contains:
- Title.
- One or more images.
- Status.

A user can create, edit, and delete only their own listings. The server must enforce ownership.

### Browse and search
- Listings are never publicly browsable; a listing is revealed only when a lost-report search matches it.
- Search matches by photos (image similarity) and by title wording as a fallback.
- Sort by newest first by default.
- Provide clear empty, loading, and error states.

### Claims
- A signed-in user can submit a claim on an active listing.
- The claim message is private and is not displayed publicly.
- A user cannot claim their own listing.
- Prevent duplicate pending claims by the same claimant for the same listing.
- The listing owner can accept or reject a pending claim.
- Only the listing owner can decide on claims for their listing.
- Acceptance must be handled atomically or with a transaction/conditional update so two claims cannot both be accepted.
- A successful return marks the listing as returned.

## 5. Non-functional requirements

- TypeScript strict mode enabled.
- Server-side validation for all untrusted input.
- Consistent API response shape.
- Secure password hashing.
- Authentication and authorization on protected routes.
- Pagination limits to prevent expensive queries.
- Image file size and type restrictions.
- No secrets committed to source control.
- Responsive and accessible frontend.
- Automated tests for critical business rules.

## 6. MVP acceptance criteria

The MVP is ready when:
- A user can register and sign in.
- A signed-in user can create a found-item listing with a photo.
- Another user can search and view that listing.
- Another user can submit a claim.
- The listing owner can accept or reject the claim.
- Unauthorized users cannot edit or delete someone else's listing.
- Passwords and private claim details are never exposed in public responses.
- Core flows have automated tests.
