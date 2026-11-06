# 13 — Testing Plan

## Test layers

### Unit tests
Test individual services and utility functions:
- Password hashing and comparison.
- Registration input validation.
- Search filter construction.
- Claim state transitions.
- Permission checks.
- Pagination parsing.

### Integration tests
Use a test database or isolated MongoDB test environment:
- Register and login.
- Duplicate email rejected.
- Invalid credentials rejected.
- Protected route rejects missing token.
- Authenticated user can create an item.
- User cannot edit another user's item.
- Public search returns only public fields.
- Claim submission rejects own listing.
- Duplicate pending claim rejected.
- Only item owner can decide claim.
- Two claims cannot both be accepted.
- User cannot read another user's notifications.

### Frontend tests
- Registration form validation.
- Login error display.
- Item form validation.
- Search and filter interactions.
- Protected route behavior.
- Claim submission flow.
- Loading, empty, and error states.

### End-to-end tests
Test the complete journey:
1. User A registers.
2. User A publishes a found item.
3. User B registers.
4. User B finds the listing and submits a claim.
5. User A reviews and accepts it.
6. User B sees the notification.
7. User A marks the item returned.

## Important security tests

- No password hash in any API response.
- No claim message in public item response.
- No user can modify another user's item.
- No user can decide a claim on an item they do not own.
- No arbitrary role assignment through profile update.
- No upload above size/type limits.
- No access to another user's notifications.

## Definition of done

A feature is complete when:
- Input is validated.
- Authorization is enforced on the server.
- Success and error responses are consistent.
- Tests cover expected and forbidden behavior.
- No secrets are committed.
- Frontend has loading, empty, and error states where relevant.
