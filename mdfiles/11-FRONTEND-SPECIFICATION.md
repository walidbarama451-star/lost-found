# 11 — React Frontend Specification

## Technology

- React + TypeScript + Vite.
- React Router for navigation.
- Fetch or Axios for HTTP.
- A consistent form library or controlled forms.
- Zod for client-side form validation where useful.
- Responsive CSS or a chosen component/styling system.

The frontend is a browser client. It must never connect directly to MongoDB or contain backend secrets.

## Pages

### Public
- Home / browse listings.
- Search results.
- Item details.
- Register.
- Login.

### Authenticated
- Dashboard.
- Create found-item listing.
- Edit own listing.
- My listings.
- Submit claim.
- My submitted claims.
- Claims received on own listings.
- Profile.

## Main components

- `AppLayout`
- `Sidebar`
- `ProtectedRoute`
- `ItemCard`
- `ItemGrid`
- `ItemForm`
- `ImageUploader`
- `ClaimForm`
- `ClaimStatusBadge`
- `Pagination`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `ConfirmDialog`

## Routing proposal

- `/`
- `/items/:itemId`
- `/register`
- `/login`
- `/dashboard`
- `/items/new`
- `/items/:itemId/edit`
- `/my-items`
- `/claims`
- `/items/:itemId/claims`
- `/profile`

Protect authenticated routes. Hiding a button is not authorization; the backend must still enforce every permission.

## Frontend behavior

- Show loading state while requests are pending.
- Show field-level validation errors.
- Show friendly API error messages.
- Confirm destructive actions.
- Disable submit buttons while requests are in progress.
- Refresh listing data after create/update/delete.
- Handle expired authentication credentials gracefully.
- Provide accessible labels, keyboard navigation, and sufficient contrast.
- Make layouts usable on narrow mobile screens.

## API client

Create one API client module that:
- Reads the API base URL from a Vite environment variable.
- Adds authentication credentials using the selected secure token strategy.
- Serializes JSON bodies.
- Handles non-2xx responses consistently.
- Does not log secrets or sensitive claim content.

Vite environment variables exposed to the browser must be treated as public. Never prefix backend secrets with `VITE_`.

## Design direction

Use a clean, trustworthy visual style:
- Clear “Found items” browsing.
- Strong, readable item photos.
- Clear status labels.
- Simple forms.
- Privacy reminder near claim forms.
