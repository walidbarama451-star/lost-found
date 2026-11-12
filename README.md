# Lost & Found

A full-stack Lost & Found platform with a **search-gated flow**: found belongings stay private, and the only way to see them is to search for your own lost item with a photo. A private claim process lets owners safely verify and return items.

Built with TypeScript on both sides — React (Vite) in the browser, an Express REST API, MongoDB, and Cloudinary-compatible image storage.

## How it works

1. **Finders publish found items** with 1–5 photos — these listings are **hidden from everyone**. There is no public browse page.
2. **Owners of lost items search with a photo**: they upload a photo of their missed item (or something that looks close) and give the search a short title. Each search is saved as a **lost report**.
3. **Photo matching**: the search compares the report's photos against the photos of every active found item using AI image embeddings (CLIP via the Hugging Face Inference API). Found items that look similar (similarity ≥ threshold) appear to the searcher with a "% similar" badge.
4. **The searcher checks whether it's really theirs** by opening the matched listing and submitting a private claim. The existing claim flow (owner accepts → item marked returned) completes the handover.

Without an `HF_TOKEN` configured, matching gracefully falls back to title-wording text similarity, so the app still works with zero external accounts.

## Features (MVP)

- **Accounts** — register, sign in, sign out, and edit your profile. Passwords are bcrypt-hashed and never leave the server; sessions live in an **HttpOnly cookie** (no tokens in JavaScript).
- **Listings** — publish a found item with 1–5 photos and a title. Owners edit or soft-close only their own listings.
- **Lost reports & photo search** — signed-in users create photo-based searches for their lost items; matches are stored on the report and can be refreshed any time (`POST /lost-reports/:id/search`) to catch newly published found items.
- **Claims** — a signed-in user privately explains why an item is theirs. The message is visible only to the claimant and the listing owner. Owners accept or reject; acceptance is an **atomic, race-safe state transition** (exactly one accepted claim per listing).
- **Recovery flow** — accepted claim → listing `CLAIMED` → owner marks `RETURNED`.
- **Security** — server-side validation (Zod), ownership enforced in services, CSRF origin checks, rate limiting, Helmet headers, upload type/size/magic-byte validation.

## Repository layout

```text
├── backend/          Express + TypeScript REST API
│   ├── src/
│   │   ├── config/         env, database, image storage
│   │   ├── middleware/     auth, validation, CSRF, uploads, errors, rate limits
│   │   ├── modules/        auth, users, items, lostReports, claims
│   │   ├── shared/         errors, types, utils
│   │   ├── app.ts          express app (also used by tests)
│   │   └── server.ts       entry point
│   └── tests/              integration + unit tests (Vitest + Supertest)
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
| `HF_TOKEN` | Hugging Face token enabling **photo matching** (free at huggingface.co/settings/tokens). Without it, matching falls back to text similarity |
| `HF_EMBEDDING_MODEL` | Embedding model (default `openai/clip-vit-base-patch32`) |
| `SIMILARITY_THRESHOLD` | Minimum cosine similarity (0–1) for a photo match (default `0.8`) |
| `TEXT_MATCH_THRESHOLD` | Minimum text similarity (0–1) for a wording-based match when photo vectors are unavailable (default `0.45`) |

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
- Full flow: register two accounts → publish a found item with a photo (account A) → create a lost report with a photo of the same kind of item (account B) → the item appears as a match → claim → accept → mark returned.

## Tests

```powershell
cd backend
npm test        # tests: auth, items, lost reports + matching, claims, security, units

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
| Items | `POST /items`, `GET /items/mine`, `GET /items/:id` (owner + matched searchers only), `PATCH /items/:id`, `DELETE /items/:id`, `PATCH /items/:id/return`, `POST /items/:id/images`, `DELETE /items/:id/images/:publicId` |
| Lost reports | `POST /lost-reports`, `GET /lost-reports`, `GET /lost-reports/:id`, `POST /lost-reports/:id/search`, `PATCH /lost-reports/:id`, `DELETE /lost-reports/:id` |
| Claims | `POST /claims`, `GET /claims/mine`, `GET /items/:id/claims`, `PATCH /claims/:id/decision`, `PATCH /claims/:id/withdraw` |

Every response uses `{ success, data, message? }` / `{ success, false, message, errors[] }` envelopes.

## Design decisions

- **Cookie sessions instead of localStorage tokens** — an HttpOnly + SameSite=Lax cookie keeps the JWT out of JavaScript; mutating requests additionally verify the `Origin` header (CSRF defence).
- **Atomic claims without transactions** — local MongoDB has no replica set, so claim acceptance uses two guarded `findOneAndUpdate` operations plus a compensating revert: each update only matches the expected prior state, guaranteeing at most one `ACCEPTED` claim per listing under concurrency. A partial unique index (`item + claimant` where `status = PENDING`) blocks duplicate pending claims at the database level.
- **Image storage** — Cloudinary when configured; otherwise a local disk fallback under `backend/uploads/` (gitignored) served from `/uploads`, so the app works with zero external accounts. Stored as `{ url, publicId }`; remote assets are deleted only after the database update succeeds.
- **Photo matching** — each uploaded photo gets a CLIP-style embedding vector (Hugging Face Inference API) stored on the image record. The lost-report matcher computes the best cosine similarity between the report's photos and each found item's photos; below the threshold (or when no vectors exist) it falls back to title-wording text similarity. Embeddings are excluded from every API response and from default queries (`select: false`). `npm run backfill-embeddings` computes vectors for photos uploaded before matching existed.

## Security notes

- **Found items are hidden from everyone.** The public browse endpoint was removed entirely; `GET /api/items/:id` answers 404 unless the caller is the owner or the item is stored in one of the caller's lost-report match lists — item existence is never revealed to outsiders.
- Authorization is enforced in backend services for every private read/write — hiding UI controls is never the security boundary.
- Public listing responses never contain: password hashes, claim messages, private contact details, image `publicId`s, or full user documents.
- Login errors are generic (`Invalid email or password`) to prevent account enumeration.
- Uploads: 5 MB and 5 images max, JPEG/PNG/WebP only, verified by MIME type **and** magic bytes.
- Rate limits on login/register, claims, and uploads.

## Coding standards

TypeScript `strict` everywhere, ESM with `.js` import extensions, controllers stay thin while services own business rules, no `any`, no secrets in source. See `mdfiles/17-CODING-STANDARDS.md`.
