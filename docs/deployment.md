# Deployment & infra

## Docker image

**Each service owns its image.** The API's lives at `api/Dockerfile`, with `api/docker-entrypoint.sh` beside it and `api/migrations/sql` copied in — a second service added later brings its own, rather than extending this one. The build context stays the repository root, because `npm ci` needs the root lockfile and workspace manifests.

It is a multi-stage build: `tsc --noEmit` gate + esbuild → `dist/index.js` **and `dist/cli.js`**, the `goose` binary from its own stage, then a runtime image running `docker-entrypoint.sh` (`goose … up` against `DATABASE_HOST`, then `node dist/index.js`). `npm ci` in the image pins all TypeScript platform binaries, so the broken local `.bin/tsc` symlink issue does not occur there.

The image also installs `webgame-api` on the PATH as a one-line wrapper around `dist/cli.js`, so
`docker exec <container> webgame-api status` reaches the control API — see [operations.md](operations.md).

`.github/workflows/publish-api.yml` builds and pushes it to `ghcr.io/<repo>/api`, path-filtered to `api/**` and the root manifests.

The **web** build is deployed separately (static output). `.github/workflows/publish-web.yml` builds `@webgame-cloud/web` and publishes it. It reads `VITE_API_URL` from a **repository variable** and fails the run when it is unset, rather than shipping a build silently pointed at a placeholder origin; the analytics vars are optional and passed through the same way.

## Environment

- Database: `DATABASE_HOST`, `DATABASE_PORT` (5432), `DATABASE_USER`, `DATABASE_PASS`, `DATABASE_NAME` (`starter`), `DATABASE_SSLMODE` (`disable` — honoured by the pool as well as by goose), `DATABASE_POOL_MAX` (10), `DATABASE_STATEMENT_TIMEOUT_MS` (15000), `DATABASE_SLOW_MS` (1000).
- Server: `APP_ENV` (`development`; `production` turns on the boot-time config guard — operations.md), `PORT` (6000), `CONTROL_PORT` (6010, bound to 127.0.0.1 only), `WEB_URL`, `API_URL`, `WORKSPACE_NAME` (`WebGame Cloud` — the name printed on public invoices and returned by `/api/public/constants`).
- Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (each provider activates when both its vars are set), `DEV_LOGIN` (never `true` in prod; auto-disabled when any provider is configured).
- Logging: `LOG_LEVEL` (`info`) for the app-level logger, `DEBUG` — scope patterns widened to debug (e.g. `DEBUG=repo` for per-query timings). Fastify's request logs are separate and always on.
- `CORS_ORIGIN` — the switch between deploy shapes:
  - **unset** = same-origin (API and web on one origin). Session cookie is `SameSite=Lax`.
  - **set** = cross-origin. Enables the CORS header hook and forces `SameSite=None; Secure` on the session cookie so credentialed fetches carry it.

The CSRF guard (`http.ts`) rejects any mutating request whose `Origin` is neither the API's own origin, `CORS_ORIGIN`, nor (in dev) localhost.

## Local

Postgres runs in a local Docker container; `npm run migrate` then `npm run dev`. Locally these variables come from a root `.env` (copied from `.env.example`) — see [local-development.md](local-development.md) for how the API and the migration scripts load it. In a deployed image they are real environment variables; nothing reads `.env` there. See `CLAUDE.md` for commands and the Node 20+ requirement. The `verify` skill drives both servers end to end.
