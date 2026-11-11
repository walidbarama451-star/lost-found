# Lost & Found — Project Documentation

A full-stack Lost & Found platform built with TypeScript.

## Product goal

Help people report found belongings and help owners find and safely reclaim them.

A user can:
- Register, sign in, and manage a profile.
- Publish an item they found, including photos, description, category, and date.
- Browse and search found-item listings.
- Submit a private claim explaining why an item belongs to them.
- Communicate through a safe contact workflow.
- Receive notifications about claims and listing status.

## Technology decisions

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI / routing | React Router; choose a consistent component and styling approach |
| API client | Fetch or Axios |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Authentication | JWT access tokens, bcryptjs password hashing |
| Image storage | Cloudinary |
| Testing | Vitest; Supertest for API integration tests |
| API documentation | OpenAPI / Swagger |
| Development | npm, ESLint, Prettier |

## Documentation map

- `01-PRODUCT-REQUIREMENTS.md` — goals, users, scope, and acceptance criteria.
- `02-USER-FLOWS.md` — key journeys and business rules.
- `03-ARCHITECTURE.md` — system design and folder structures.
- `04-DATABASE-DESIGN.md` — MongoDB collections and relationships.
- `05-API-SPECIFICATION.md` — REST endpoints and request/response conventions.
- `06-AUTHENTICATION-AND-USERS.md` — registration, login, profiles, authorization.
- `07-ITEMS-AND-SEARCH.md` — found-item listings, filters, and lifecycle.
- `08-CLAIMS-AND-RECOVERY.md` — ownership claims and safe return process.
- `09-IMAGES-AND-FILES.md` — upload validation and Cloudinary.
- `10-NOTIFICATIONS.md` — in-app notifications and optional email.
- `11-FRONTEND-SPECIFICATION.md` — React pages, components, and state.
- `12-SECURITY-AND-PRIVACY.md` — security, abuse prevention, and privacy.
- `13-TESTING-PLAN.md` — unit, integration, and end-to-end tests.
- `14-SETUP-AND-ENVIRONMENT.md` — setup commands and environment variables.
- `15-IMPLEMENTATION-ROADMAP.md` — phased build plan and task checklist.
- `16-DEPLOYMENT.md` — deployment checklist.
- `17-CODING-STANDARDS.md` — TypeScript conventions and AI-agent rules.

## Recommended implementation order

1. Read product requirements, user flows, architecture, and database design.
2. Create the backend and connect MongoDB.
3. Implement authentication and user profiles.
4. Implement item creation, listing, editing, deletion, and search.
5. Implement image uploads.
6. Implement claims and notifications.
7. Build the React frontend and connect it to the API.
8. Add tests, security checks, and deployment configuration.

## Important product rule

A public listing must not expose private proof-of-ownership details. A claimant should provide identifying details privately, and the finder should verify them before arranging a return.

## MVP boundary

Build the core flows first. Real-time chat, AI image matching, maps, push notifications, and admin analytics are future enhancements, not requirements for the first working release.
