# Deployment & infra

## Docker image

`Dockerfile` is a multi-stage build that compiles and bundles the **API only** (`tsc --noEmit` gate + esbuild → single `dist/index.js`), fetches the `goose` binary, and ships a runtime image running `docker-entrypoint.sh`: `goose ... up` against `DATABASE_HOST`, then `node dist/index.js`. `npm ci` in the image pins all TypeScript platform binaries, so the broken local `.bin/tsc` symlink issue does not occur there.

The **web** build is deployed separately (static output). `.github/workflows/publish-web.yml` builds `@webgame-cloud/web` and publishes it; set `VITE_API_URL` to the API origin (empty = same origin).

## Environment

- Database: `DATABASE_HOST`, `DATABASE_PORT` (5432), `DATABASE_USER`, `DATABASE_PASS`, `DATABASE_NAME` (`starter`), `DATABASE_SSLMODE` (`disable`).
- Server: `PORT` (6000), `WEB_URL`, `API_URL`, `WORKSPACE_NAME` (`WebGame Cloud` — the name printed on public invoices and returned by `/api/public/constants`).
- Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (each provider activates when both its vars are set), `DEV_LOGIN` (never `true` in prod; auto-disabled when any provider is configured).
- Logging: `LOG_LEVEL` (`info`) for the app-level logger, `DEBUG` — scope patterns widened to debug (e.g. `DEBUG=repo` for per-query timings). Fastify's request logs are separate and always on.
- `CORS_ORIGIN` — the switch between deploy shapes:
  - **unset** = same-origin (API and web on one origin). Session cookie is `SameSite=Lax`.
  - **set** = cross-origin. Enables the CORS header hook and forces `SameSite=None; Secure` on the session cookie so credentialed fetches carry it.

The CSRF guard (`http.ts`) rejects any mutating request whose `Origin` is neither the API's own origin, `CORS_ORIGIN`, nor (in dev) localhost.

## Local

Postgres runs in a local Docker container; `npm run migrate` then `npm run dev`. Locally these variables come from a root `.env` (copied from `.env.example`) — see [local-development.md](local-development.md) for how the API and the migration scripts load it. In a deployed image they are real environment variables; nothing reads `.env` there. See `CLAUDE.md` for commands and the Node 20+ requirement. The `verify` skill drives both servers end to end.
