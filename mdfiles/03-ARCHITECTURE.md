# 03 — System Architecture

## 1. Overview

Use a separate frontend and backend:

```text
Browser
  |
  v
React + TypeScript + Vite
  |
  | HTTPS / JSON / multipart form data
  v
Express + TypeScript REST API
  |             |
  v             v
MongoDB       Cloudinary
```

The React app must never connect directly to MongoDB or contain database credentials.

## 2. Backend structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── cloudinary.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── items/
│   │   ├── claims/
│   │   └── notifications/
│   ├── shared/
│   │   ├── errors/
│   │   ├── types/
│   │   └── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

Each module should contain its own model, schema/validation, service, controller, and routes where appropriate.

Responsibilities:
- **Routes:** map HTTP methods and paths to middleware/controllers.
- **Controllers:** read request data and send HTTP responses.
- **Services:** implement business rules and coordinate data access.
- **Models:** define MongoDB document schemas.
- **Validation:** validate request bodies, params, and query strings.
- **Middleware:** authentication, validation, error handling, and request controls.

Keep controllers thin. Business rules belong in services.

## 3. Frontend structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── items/
│   │   └── common/
│   ├── features/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── items/
│   │   ├── claims/
│   │   └── notifications/
│   ├── pages/
│   ├── lib/
│   │   └── api.ts
│   ├── types/
│   ├── hooks/
│   ├── styles/
│   └── main.tsx
├── public/
├── .env.example
└── package.json
```

## 4. Request lifecycle

1. Browser sends request.
2. Express applies CORS, JSON parsing, and request limits.
3. Route applies authentication when required.
4. Validation middleware validates input.
5. Controller calls a service.
6. Service enforces business rules and reads/writes MongoDB.
7. Controller returns a safe response.
8. Central error middleware handles unexpected errors.

## 5. Architecture rules

- Use TypeScript strict mode.
- Use ESM consistently; use `.js` import extensions in TypeScript source when using NodeNext compilation.
- Do not put business logic in route files.
- Do not trust client-provided user IDs for ownership.
- Derive the acting user ID from the verified authentication credential.
- Keep API and frontend types aligned, preferably through shared contracts or generated OpenAPI types.
- Never expose secrets or internal database documents directly.
