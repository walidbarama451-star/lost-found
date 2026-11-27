# 05 — REST API Specification

Base URL in development: `http://localhost:5000/api`

All JSON endpoints use `Content-Type: application/json`, except multipart image upload endpoints.

## Response conventions

Success:
```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable message"
}
```

Error:
```json
{
  "success": false,
  "message": "A useful error message",
  "errors": []
}
```

Use appropriate HTTP status codes:
- `200`: successful read/update/action.
- `201`: resource created.
- `204`: successful deletion with no response body.
- `400`: invalid input.
- `401`: missing/invalid authentication.
- `403`: authenticated but not allowed.
- `404`: resource not found.
- `409`: conflict, such as duplicate email or invalid state transition.
- `413`: upload too large.
- `415`: unsupported media type.
- `429`: rate limit exceeded.
- `500`: unexpected server error.

## Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Sign in |
| GET | `/auth/me` | Yes | Current user |
| POST | `/auth/logout` | Depends on token strategy | Sign out / revoke refresh session if implemented |

Register body:
```json
{
  "username": "sam",
  "email": "sam@example.com",
  "password": "StrongPassword123"
}
```

Login body:
```json
{
  "email": "sam@example.com",
  "password": "StrongPassword123"
}
```

## Users

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/users/me` | Yes | Get own profile |
| PATCH | `/users/me` | Yes | Update allowed profile fields |

Never accept `role`, password hash, or arbitrary account flags from profile updates.

## Items

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/items` | Yes | Create listing |
| GET | `/items/:itemId` | Yes (owner or matched searcher) | Get listing detail |
| PATCH | `/items/:itemId` | Yes + owner | Update own listing |
| DELETE | `/items/:itemId` | Yes + owner | Delete/close own listing |
| GET | `/items/mine` | Yes | Get own listings |

Example create body:
```json
{
  "title": "Black wallet"
}
```

Listings are never publicly browsable — there is no `GET /items` list endpoint.

## Claims

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/claims` | Yes | Submit claim |
| GET | `/items/:itemId/claims` | Yes + item owner | Claims on own item |
| PATCH | `/claims/:claimId/decision` | Yes + item owner | Accept or reject |

Submit body:
```json
{
  "itemId": "VALID_OBJECT_ID",
  "message": "I can identify a unique mark on the inside."
}
```

Decision body:
```json
{
  "decision": "ACCEPTED"
}
```

The private claim message must never appear in public item responses.

## Pagination

List endpoints should return:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Rules:
- Default page: `1`.
- Default limit: `12`.
- Maximum limit: `50`.
- Validate page and limit as positive integers.
- Whitelist sort fields and directions.
- Never pass raw user-provided MongoDB query objects to Mongoose.

## Authentication header

For bearer-token authentication:
`Authorization: Bearer <access-token>`

Do not put tokens in URLs or logs.

## API documentation

Maintain an OpenAPI specification as the API grows. Document request schemas, response schemas, authentication, status codes, and example requests.
