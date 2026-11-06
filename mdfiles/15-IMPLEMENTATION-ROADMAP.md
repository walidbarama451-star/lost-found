# 15 — Implementation Roadmap

Work in small phases. Do not generate the entire application in one step.

## Phase 0 — Planning
- [ ] Read all project documentation.
- [ ] Confirm MVP scope.
- [ ] Create Git repository.
- [ ] Create `backend`, `frontend`, and `docs` folders.

## Phase 1 — Backend foundation
- [ ] Initialize Node.js and TypeScript.
- [ ] Configure strict TypeScript and ESM.
- [ ] Create Express app and server.
- [ ] Add environment configuration.
- [ ] Add centralized error handling.
- [ ] Connect MongoDB.
- [ ] Add health-check endpoint.
- [ ] Confirm `npm run build` succeeds.

## Phase 2 — Authentication and users
- [ ] Create User model.
- [ ] Add registration validation.
- [ ] Implement password hashing.
- [ ] Implement login.
- [ ] Implement authentication middleware.
- [ ] Implement current-user endpoint.
- [ ] Implement profile read/update.
- [ ] Add authentication tests.

## Phase 3 — Items
- [ ] Create Item model and indexes.
- [ ] Create item validation schemas.
- [ ] Implement create listing.
- [ ] Implement public list and detail.
- [ ] Implement owner-only update.
- [ ] Implement owner-only close/delete.
- [ ] Implement pagination.
- [ ] Implement search and filters.
- [ ] Add item tests.

## Phase 4 — Image uploads
- [ ] Configure Cloudinary.
- [ ] Add multipart upload middleware.
- [ ] Validate type, content, count, and size.
- [ ] Upload images securely.
- [ ] Save URL and public ID.
- [ ] Implement cleanup on failure and deletion.
- [ ] Test invalid and oversized files.

## Phase 5 — Claims
- [ ] Create Claim model and indexes.
- [ ] Implement claim submission.
- [ ] Prevent claiming own item.
- [ ] Prevent duplicate pending claims.
- [ ] Implement owner-only accept/reject.
- [ ] Handle concurrent claim decisions.
- [ ] Implement claim withdrawal if in scope.
- [ ] Add privacy and authorization tests.

## Phase 6 — Notifications
- [ ] Create Notification model.
- [ ] Notify item owner on new claim.
- [ ] Notify claimant on decision.
- [ ] List own notifications.
- [ ] Mark one/all as read.
- [ ] Add tests.

## Phase 7 — React foundation
- [ ] Create React + TypeScript + Vite app.
- [ ] Configure routes and layouts.
- [ ] Create API client.
- [ ] Create shared types.
- [ ] Build registration and login pages.
- [ ] Connect authentication to backend.
- [ ] Build protected routes.

## Phase 8 — React product features
- [ ] Build browse page.
- [ ] Build item cards and detail page.
- [ ] Build search and filter controls.
- [ ] Build create/edit listing forms.
- [ ] Build image uploader.
- [ ] Build claims pages.
- [ ] Build notifications page.
- [ ] Build profile page.
- [ ] Add responsive and accessible UI.

## Phase 9 — Quality and launch
- [ ] Add backend integration tests.
- [ ] Add frontend tests.
- [ ] Test complete user journey.
- [ ] Review security checklist.
- [ ] Add OpenAPI documentation.
- [ ] Configure production environment.
- [ ] Deploy backend, frontend, and database.
- [ ] Test production flows.

## Development rule

Finish and test one phase before beginning the next. Commit working milestones to Git. Do not move secrets into source code to make a local test pass.
