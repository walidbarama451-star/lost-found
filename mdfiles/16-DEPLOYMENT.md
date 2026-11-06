# 16 — Deployment Checklist

## Components to deploy

- React frontend: a static hosting platform.
- Express API: a Node.js hosting platform.
- MongoDB: MongoDB Atlas.
- Images: Cloudinary.

Choose providers based on current pricing, region, limits, and project needs.

## Backend production configuration

Set:
- `NODE_ENV=production`
- `PORT` according to host requirements.
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` to the exact frontend origin.
- Cloudinary credentials.

Do not commit or expose production secrets.

## Frontend production configuration

Set:
- `VITE_API_BASE_URL` to the deployed API base URL.

Remember that Vite variables are bundled into public frontend assets. They must not contain secrets.

## Production checklist

- [ ] HTTPS enabled.
- [ ] Exact CORS origin configured.
- [ ] Helmet/security headers enabled.
- [ ] Rate limiting enabled.
- [ ] Production error responses do not reveal stack traces.
- [ ] Database user has least required privileges.
- [ ] MongoDB network access is restricted appropriately.
- [ ] Cloudinary secrets are server-side only.
- [ ] Upload limits configured.
- [ ] Database backups enabled and restore process tested.
- [ ] Logs avoid tokens, passwords, and private claim content.
- [ ] Health-check endpoint configured.
- [ ] Frontend points to production API.
- [ ] Registration, login, upload, search, claim, and return flows tested after deployment.

## Operational considerations

Monitor API errors, response times, database usage, and storage usage. Establish a process for dependency updates, secret rotation, backups, and incident response.
