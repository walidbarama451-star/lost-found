# Lost & Found

A full-stack Lost & Found platform: people publish found belongings with photos, owners search for them, and a private claim process lets owners safely verify and return items.

Built with TypeScript on both sides — React (Vite) in the browser, an Express REST API, MongoDB, and Cloudinary-compatible image storage.

## Features (MVP)

- **Accounts** — register, sign in, sign out, and edit your profile. Passwords are bcrypt-hashed and never leave the server; sessions live in an **HttpOnly cookie** (no tokens in JavaScript).
- **Listings** — publish a found item with 1–5 photos, category, and date found. Owners edit or soft-close only their own listings.
- **Browse & search** — public, paginated search by keyword, category, and date range (regex-safe, whitelisted filters).
- **Claims** — a signed-in user privately explains why an item is theirs. The message is visible only to the claimant and the listing owner. Owners accept or reject; acceptance is an **atomic, race-safe state transition** (exactly one accepted claim per listing).
- **Recovery flow** — accepted claim → listing `CLAIMED` → owner marks `RETURNED`.
- **Notifications** — in-app notifications for claim submitted/accepted/rejected and item returned, with unread counts and mark-read.
- **Security** — server-side validation (Zod), ownership enforced in services, CSRF origin checks, rate limiting, Helmet headers, upload type/size/magic-byte validation.

## Repository layout

```text
├── backend/          Express + TypeScript REST API
│   ├── src/
│   │   ├── config/         env, database, image storage
│   │   ├── middleware/     auth, validation, CSRF, uploads, errors, rate limits
│   │   ├── modules/        auth, users, items, claims, notifications
│   │   ├── shared/         errors, types, utils
│   │   ├── app.ts          express app (also used by tests)
│   │   └── server.ts       entry point
│   └── tests/              76 integration + unit tests (Vitest + Supertest)
├── frontend/         React + TypeScript + Vite client
│   └── src/                app router, components, features, pages, plain CSS
├── docs/             OpenAPI specification (served interactively at /api/docs)
├── mdfiles/          product specifications this build was written from
└── README.md
```

## Prerequisites

- Node.js 20+ (developed on 24) and npm
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or an Atlas connection string)
- Optional: a Cloudinary account for production image hosting

## Setup

```powershell
# 1. Backend
cd backend
npm install
Copy-Item .env.example .env    # then edit the values

# 2. Frontend
cd ../frontend
npm install
Copy-Item .env.example .env
```

### Backend environment (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | **Required in production.** Cookie signing secret — generate a long random value |
| `JWT_EXPIRES_IN` | Access cookie lifetime (default `30m`) |
| `CLIENT_URL` | Exact frontend origin, used for CORS + CSRF origin checks (`http://localhost:5173`) |
| `IMAGE_STORAGE` | `local` (disk fallback, no account needed) or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server-side only; when all three are set with `IMAGE_STORAGE=cloudinary`, images go to Cloudinary |

> Never commit real `.env` files — they are gitignored. Only `.env.example` is tracked.

## Running locally

```powershell
# Terminal 1 — API on http://localhost:5000
cd backend
npm run dev

# Terminal 2 — web app on http://localhost:5173
cd frontend
npm run dev
```

Smoke checks:
- `GET http://localhost:5000/api/health` → `{"success":true,"data":{"status":"ok",...}}`
- API docs (Swagger UI): `http://localhost:5000/api/docs`
- Full flow: register → publish a listing with a photo → search it from a second account → claim → accept → mark returned.

## Tests

```powershell
cd backend
npm test        # 76 tests: auth, items, claims, notifications, security, units

cd ../frontend
npm test        # component tests (Vitest + Testing Library)
```

Backend tests run against an isolated database (`lost-and-found-test` by default; override with `MONGODB_TEST_URI`) and drop all data between test cases.

## API overview

Base URL `http://localhost:5000/api` — full contract in [`docs/openapi.yaml`](docs/openapi.yaml) (interactive at `/api/docs`).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Profile | `GET /users/me`, `PATCH /users/me`, `GET /users/:userId` (public profile: username + Discord) |
| Items | `GET /items`, `POST /items`, `GET /items/mine`, `GET /items/:id`, `PATCH /items/:id`, `DELETE /items/:id`, `PATCH /items/:id/return`, `POST /items/:id/images`, `DELETE /items/:id/images/:publicId` |
| Claims | `POST /claims`, `GET /claims/mine`, `GET /items/:id/claims`, `PATCH /claims/:id/decision`, `PATCH /claims/:id/withdraw` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |

Every response uses `{ success, data, message? }` / `{ success, false, message, errors[] }` envelopes.

## Design decisions

- **Cookie sessions instead of localStorage tokens** — an HttpOnly + SameSite=Lax cookie keeps the JWT out of JavaScript; mutating requests additionally verify the `Origin` header (CSRF defence).
- **Atomic claims without transactions** — local MongoDB has no replica set, so claim acceptance uses two guarded `findOneAndUpdate` operations plus a compensating revert: each update only matches the expected prior state, guaranteeing at most one `ACCEPTED` claim per listing under concurrency. A partial unique index (`item + claimant` where `status = PENDING`) blocks duplicate pending claims at the database level.
- **Image storage** — Cloudinary when configured; otherwise a local disk fallback under `backend/uploads/` (gitignored) served from `/uploads`, so the app works with zero external accounts. Stored as `{ url, publicId }`; remote assets are deleted only after the database update succeeds.
- **Search** — case-insensitive regex over title/description with escaped input (documented limitation: unindexed, MVP scale; upgrade path is a text index or Atlas Search).

## Security notes

- Authorization is enforced in backend services for every private read/write — hiding UI controls is never the security boundary.
- Public listing responses never contain: password hashes, claim messages, private contact details, image `publicId`s, or full user documents.
- Login errors are generic (`Invalid email or password`) to prevent account enumeration.
- Uploads: 5 MB and 5 images max, JPEG/PNG/WebP only, verified by MIME type **and** magic bytes.
- Rate limits on login/register, claims, and uploads.

## Coding standards

TypeScript `strict` everywhere, ESM with `.js` import extensions, controllers stay thin while services own business rules, no `any`, no secrets in source. See `mdfiles/17-CODING-STANDARDS.md`.
