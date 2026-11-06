# 17 — Coding Standards and AI Agent Instructions

These rules apply to every contributor and AI coding agent.

## General rules

- Use TypeScript for frontend and backend.
- Keep `strict: true`.
- Avoid `any`; use `unknown` and narrow types when the type is not known.
- Use clear, descriptive names.
- Keep functions focused.
- Prefer small modules over large files.
- Do not duplicate business logic.
- Do not commit generated `dist` or `node_modules`.
- Do not commit secrets or real user data.

## Backend rules

- Separate routes, controllers, services, models, and validation.
- Controllers handle HTTP only.
- Services own business rules.
- Validate body, query, and params at the API boundary.
- Use typed request/response DTOs.
- Never trust user IDs supplied by the client.
- Never return Mongoose documents directly when they contain private fields; map to explicit response objects.
- Use centralized error handling.
- Use consistent status codes and response shapes.
- Use safe MongoDB query construction and whitelisted sort fields.
- Enforce ownership in services.

## Frontend rules

- Use reusable components.
- Keep API calls in a shared API layer or feature service.
- Keep form validation and error handling consistent.
- Use typed API response models.
- Provide loading, empty, success, and error states.
- Keep secrets out of frontend code.
- Do not treat client-side route guards as security.

## Naming

- Components and types: `PascalCase`.
- Variables and functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` where appropriate.
- React components: descriptive names such as `ItemCard`.
- Files: use one consistent convention within each layer.

## Error handling

- Expected user errors should return safe, understandable messages.
- Unexpected errors should be logged server-side with a request identifier.
- Never send stack traces, database connection strings, tokens, or secrets to clients.

## AI coding agent workflow

When asked to implement a feature:
1. Read this documentation and the relevant feature documents.
2. Inspect the existing code before changing it.
3. State which files will be created or modified.
4. Implement only the requested phase.
5. Add validation and authorization.
6. Add or update tests.
7. Run type checking, tests, and build.
8. Report changed files, commands run, results, and any remaining work.
9. Do not claim tests passed unless they were actually run.
10. Do not silently change the documented API contract or database rules.

## Do not

- Generate the whole application in one giant file.
- Skip tests for authentication or ownership checks.
- store plaintext passwords.
- expose private claim details publicly.
- trust frontend validation alone.
- add unrequested AI, chat, payments, or complex features before the MVP works.
