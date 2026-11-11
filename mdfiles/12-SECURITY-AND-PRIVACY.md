# 12 — Security and Privacy Requirements

## Secrets

- Keep `.env` out of Git.
- Commit `.env.example` with placeholder values only.
- Use separate secrets for development and production.
- Rotate credentials if exposed.
- Never put MongoDB or Cloudinary secrets in React/Vite environment variables.

## Authentication

- Hash passwords using bcrypt/bcryptjs.
- Use HTTPS in production.
- Use short-lived access tokens.
- Prefer secure HttpOnly cookies and a carefully designed refresh strategy for browser sessions.
- If cookies are used, implement CSRF protections appropriate to the cookie and deployment configuration.
- Rate-limit login, registration, password reset, and claim endpoints.
- Never log authorization headers or tokens.

## Input and database safety

- Validate request bodies, query strings, and route params.
- Whitelist accepted fields.
- Never pass raw client objects directly to MongoDB filters or update operators.
- Avoid unsafe dynamic regular expressions.
- Limit request body size.
- Handle invalid ObjectIds cleanly.
- Use centralized error handling without leaking stack traces in production.

## Authorization

- Derive user ID from verified authentication.
- Verify ownership for every private read/write.
- Scope notification and claim queries to the current user.
- Do not rely on frontend route protection alone.

## Privacy

- Keep claim messages private.
- Do not publish private phone numbers or email addresses by default.
- Avoid exposing identifying proof details in listing text or notifications.
- Collect only data necessary for the service.
- Define a retention and deletion policy.

## Upload safety

- Restrict file types and sizes.
- Validate actual file content where feasible.
- Do not allow arbitrary remote URL uploads.
- Store provider credentials only on backend.
- Avoid serving user uploads from a trusted application origin if not needed.

## Production headers and operations

- Use Helmet or equivalent secure headers.
- Configure CORS for exact trusted origins.
- Use rate limiting.
- Keep dependencies updated.
- Log operational events without logging secrets or private claim contents.
- Back up the database and test restoration.
