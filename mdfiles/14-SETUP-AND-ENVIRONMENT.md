# 14 — Setup and Environment

## Prerequisites

Install:
- Current Node.js LTS release.
- npm.
- VS Code or another TypeScript editor.
- MongoDB Atlas account or local MongoDB.
- Postman or another API client.
- Git.

Check:
```bash
node -v
npm -v
git --version
```

## Suggested repository

```text
lost-and-found/
├── backend/
├── frontend/
├── docs/
└── README.md
```

## Backend initialization

```bash
mkdir lost-and-found
cd lost-and-found
mkdir backend frontend docs
cd backend
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken zod helmet express-rate-limit
npm install -D typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken
npx tsc --init
```

Add development scripts to `backend/package.json`:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

Use a NodeNext-compatible TypeScript configuration and `.js` import extensions in TypeScript source when compiling as ESM.

## Frontend initialization

From repository root:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom
```

## Environment files

Backend `.env.example`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb_connection_string
JWT_SECRET=replace_with_long_random_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Frontend `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Never commit actual `.env` files.

## Run locally

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend, in a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Vite normally serves at `http://localhost:5173`; Express can serve at `http://localhost:5000`.

## MongoDB Atlas checklist

- Create a cluster.
- Create a database user with a strong password.
- Allow your development IP in Network Access.
- Copy the application connection string.
- Replace placeholders and URL-encode special characters in credentials.
- Use a restricted network policy in production; do not leave unrestricted access unnecessarily.

## First smoke tests

- `GET http://localhost:5000/` returns API health information.
- Register a test account.
- Login with that account.
- Call `/api/auth/me` with valid authentication.
- Verify a user document exists in MongoDB.
