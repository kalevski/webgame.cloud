# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**WebGame Cloud** — a hosting and build platform for browser games. Developers create a project, upload
art/audio/data assets, describe what a build should contain with a tag rule (a *bundle*), and the platform
hands the work to a **realm** (a build machine outside this application) which packs the assets and
publishes an artefact. Shipped games then read their asset manifests and live config values from a public,
credential-free runtime API.

It grew out of a full-stack template (a Postgres-backed Fastify API plus a React 19 SPA), and the template's
platform slices still ship underneath: auth and sessions, roles and permissions as runtime data, quotas and
a paywall, subscriptions and invoices, notifications, moderation and an audit log, API keys, outbound
webhooks, background jobs, data retention and admin file storage. Those are documented per feature in
`docs/`. What follows describes the product layered on top.

What ships on top of that platform:

- **Projects & membership** — a project is the workspace for one game. Its creator is the resource owner
  (`projects.owner_id`). Inside a project there are no roles: membership grants read of everything, and six
  per-project permissions (`member.manage`, `project.settings`, `file.write`, `bundle.write`, `build.run`,
  `config.write`) each grant writes in one area. Invitations carry the exact permission set they will
  materialise, and a member can never grant a permission they do not hold.
- **Two permission planes** — platform permissions are role grants resolved by `resolvePermissions`;
  project permissions are row data on `project_members.permissions` resolved by `resolveProjectPermissions`.
  They never mix, and a compile-time guard in `contracts/projectAccess.ts` fails the build if a key appears
  in both.
- **Realms** — build machines registered by staff, assigned to projects tier-aware and least-loaded. The
  API signs instructions to a realm (`realm_upload`, `realm_transfer`); a realm authenticates back with a
  per-realm bearer token. Moving a project between realms takes a **lock** — a `project_migrations` row
  whose existence makes every mutating request on that project return 423.
- **Assets** — bytes never pass through the API. The client asks for an upload, receives a 15-minute JWT,
  `PUT`s straight to the project's realm, and the realm calls back to finalise. Each asset carries one
  category and many tags.
- **Bundles & builds** — a bundle is a saved tag query, not a folder; re-tagging a file changes what it
  contains. Triggering a build freezes a snapshot and queues it for the project's realm, which long-polls
  to claim it and posts the result. Build tags (`release`, `beta`) are unique per bundle, which is how
  promotion and rollback work.
- **Config data** — schemas, configs and per-build-tag versions let a developer change a shipped game
  without rebuilding it.
- **The game runtime API** — `/api/public/*`, unauthenticated and **not enveloped**, with explicit cache
  headers and an in-process rate limiter.
- **Landing page & waitlist** — the public marketing route, and a 250 MB storage grant applied at sign-in.

Two consequences for every change made here:

1. **Follow the existing shape.** Every feature walks the same chain — contract → router → service →
   repository → SQL → slice → service → module → page. Copy the nearest neighbour rather than inventing a
   new layering.
2. **Keep the platform slices generic.** The product lives in the project/realm/asset/bundle/build/config
   slices. The platform underneath (auth, roles, billing, email, jobs) stays reusable; product logic does
   not belong in it.

All user-facing copy is **English**, read through `configs/strings.ts` (there is no runtime i18n layer, but
the indirection makes translation a single-file change).

npm workspaces monorepo: `api` (Fastify + pg), `web` (Vite + React 19 SPA), `migrations` (goose SQL) and
`realm-stub` (a dev-only fake realm). Package scope is `@webgame-cloud`.

## Local setup (from zero to running)

Prerequisites:

- **Node 20+** — `.nvmrc` pins 24; run `nvm use`. Several deps declare `>=20` and `tsx` needs it; Node 18 fails with a misleading `tsx`/decorator error.
- **Postgres running locally** and reachable with the `DATABASE_*` env vars (defaults: `localhost:5432`, OS user, no password, database `starter`, ssl disabled). A Docker Postgres mapped to 5432 works fine.
- **goose** for migrations — `brew install goose`.

```bash
nvm use
npm install         # installs all workspaces
cp .env.example .env  # then edit DATABASE_* to match your Postgres
npm run migrate     # createdb (idempotent) + goose up (migrations/sql/*.sql)
npm run dev         # api (tsx watch, :6000) + web (vite, :6001)
```

Config comes from a single root `.env` (gitignored; `.env.example` is the committed template). No `dotenv` dependency — the API passes `--env-file-if-exists=../.env` to `tsx`, and the migration/backup shell scripts source `migrations/env.sh`. Shell variables win over file values in both loaders. See `docs/local-development.md`.

Then open `http://localhost:6001`. The `dev:api` script sets `DEV_LOGIN=true`, so sign in with any email via the dev login form — **the first sign-in becomes the `owner`**. Dev login is auto-disabled if any OAuth provider is configured (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` or `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` — SSO takes over). Vite proxies `/api` to `127.0.0.1:6000`, so no CORS setup is needed locally.

Health check: `curl localhost:6000/api/health`.

## Commands

Run from repo root unless noted.

```bash
npm run dev                 # concurrently: api + web + realm stub
npm run dev:api             # api only — DEV_LOGIN=true tsx watch src/index.ts
npm run dev:web             # web only
npm run dev:realm           # the dev-only fake realm on :5100
npm run build               # tsc --noEmit + build, in every workspace that has a build script
npm run typecheck           # tsc --noEmit in every workspace
```

There is no test suite or lint script — `typecheck` and `build` (which runs `tsc --noEmit` as a gate before bundling) are the only automated checks. Two profilers run on demand through `npx` (Node 24, never added as dependencies): `npx react-doctor web` must report 0 diagnostics (suppressions live in `web/doctor.config.json`), and `npx clinic doctor` profiles the built API bundle under load — see `docs/local-development.md`. **Do not write unit, integration, or e2e tests** — see Code practices.

Migrations (workspace `@webgame-cloud/migrations`):

```bash
npm run migrate                        # from root: createdb + apply pending
npm run down -w @webgame-cloud/migrations     # roll back latest
npm run status -w @webgame-cloud/migrations   # applied/pending
npm run create -w @webgame-cloud/migrations --name=add_thing   # scaffold new migration
npm run backup -w @webgame-cloud/migrations         # pg_dump -Fc to a timestamped .dump
npm run restore-test -w @webgame-cloud/migrations   # restore a dump into a scratch DB to prove it
npm run corrupt-drill -w @webgame-cloud/migrations  # restore drill that corrupts a table first
```

Env vars the API reads (`api/src/env.ts`, defaults in parens): `PORT` (6000), `DATABASE_HOST` (localhost), `DATABASE_PORT` (5432), `DATABASE_USER` (OS user), `DATABASE_PASS` (none), `DATABASE_NAME` (starter), `DATABASE_SSLMODE` (disable), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`, `DEV_LOGIN`, `CORS_ORIGIN`, `WEB_URL`, `API_URL`, `WORKSPACE_NAME` (WebGame Cloud), `LOG_LEVEL` (info), `DEBUG`, `REALM_DEV_TOKEN` (rlm_dev_local), `REALM_STUB_PORT` (5100).

### TypeScript 7

The repo is on **TypeScript 7** (the native Go port), so `tsc` is a platform binary delivered via optional deps (`@typescript/typescript-<platform>`), not JS. Consequences: typecheck is fast and needs no Node to run; `baseUrl` is gone (TS5102) so `web/tsconfig.json` relies on `paths` alone (every mapping is `./`-prefixed); `tsc` is typecheck-only (`api` bundles with esbuild, `web` with Vite); decorators work via esbuild/tsx reading `experimentalDecorators`, but `emitDecoratorMetadata` is NOT implemented by esbuild — tsyringe works only because every constructor param carries an explicit `@inject(Token)`. **Adding an un-`@inject`ed constructor param fails at runtime, not at build.**

## Architecture

### Shared contract (`api/src/contracts/`)

The single source of truth for every cross-cutting type, split into files re-exported from `index.ts` (a barrel). Dependency-free — no server imports — so `web` imports it via the `@webgame-cloud/api/contracts` subpath (`api/package.json` `exports` field) without pulling in Fastify/pg. When adding or changing an API shape, edit the matching file here first; both sides key off it.

- `permissions.ts` — `PERMISSIONS` (the capability catalog), `Permission`, `ACCOUNT_SHAPED`, `UserRole`.
- `roles.ts` — `Role`, `RoleSlot`/`ROLE_SLOTS`, `RoleBindings`, `SEED_ROLES`, `SEED_ROLE_BINDINGS`, `OWNER_ROLE_ID`, `toRoleId`.
- `limits.ts` — `LIMITABLE_RESOURCES`, `RESOURCE_LABELS`, `AccessPolicy`, `LimitMap`, `ResolvedLimits`, per-user override shapes.
- `users.ts` — `User`, `AuthSession`, `AuthConfig`, `AccountExport`, `PlatformSettings`, `AdminOverview`.
- `notifications.ts` — `AppNotification`, `NOTIFICATION_KINDS`, `Report`/`REPORT_TARGET_KINDS`, `AuditEntry`.
- `projects.ts` — `Project`, `ProjectMember`, `ProjectInvite`, vocabularies + drafts.
- `projectAccess.ts` — `PROJECT_PERMISSIONS`, the second permission plane and its disjointness guard.
- `realms.ts`, `assets.ts`, `bundles.ts`, `builds.ts`, `configs.ts`, `waitlist.ts` — the console slices.
- `files.ts` — `ASSET_SOURCE_TYPES`, `AssetSource`/`AssetSourceDraft`, `ASSET_TYPES`/`ASSET_TYPE_LABELS` (the hand-maintained stored-file type enum), `AssetTypeBindings`, `StoredFile`. Snake identifiers in this slice are `asset_`-prefixed (`asset_sources`, `files.asset_type`); the generic storage classes stay `File*` — see docs/file-storage.md.
- `errors.ts` — the machine-readable error vocabulary: `API_ERROR_CODES`, `encodeErrorCause`/`parseErrorCause`. A rejected `cause` is always a code plus comma-joined params (`limit_reached,projects,3`), never display copy — the web renders the sentence from `strings.errors`.

### API (`api/src`)

Layering: `routers/*Router.ts` (Fastify plugins) → `services/*Service.ts` → `repositories/<domain>/<X>Repository.ts` → `Database.ts`. tsyringe DI is wired in `container.ts`; boot is `index.ts` → `http.ts`. SQL lives in `.sql` files imported as strings (esbuild inlines them; `sql.d.ts` declares the module type); row types are in `schema/*.ts`. In dev, tsx loads `api/sql-hooks.mjs` (via `--import ./sql-hooks-register.mjs`), which both loads `.sql` files and pins `@toolcase/*` imports to their ESM builds — tsx otherwise resolves their CJS builds, whose named exports fail to parse; esbuild and plain node resolve the ESM builds natively, so `import { x } from '@toolcase/...'` works everywhere directly.

**Boot lives in `http.ts`, not `index.ts`.** `index.ts` is a small entrypoint (env, container, start/stop); `http.ts` holds the server class and registers, in order: a CORS header hook (only when `CORS_ORIGIN` is set), a CSRF `Origin` guard (rejects cross-site mutating requests — the comment block there has the reasoning), `registerEnvelope`, `registerAuth`, then every plugin from the flat `ROUTE_PLUGINS` array, then a global error handler mapping Fastify validation errors to 400 and everything else to a logged 500.

- **Logging**: two loggers on purpose. Fastify's built-in pino owns per-REQUEST logs; `logging.ts` (`@toolcase/logging`) is the app/process logger — boot (`index.ts`), background sweeps (`MaintenanceService`), and repository timings. `LOG_LEVEL` sets the threshold; `DEBUG=<scope patterns>` (e.g. `DEBUG=repo`) widens single scopes to debug. Every repository extending `BaseRepository` passes `repositoryOptions` from `logging.ts` — a query ≥250ms logs a warning, `DEBUG=repo` shows every timed verb.
- **Auth** (`auth.ts`): opaque session-cookie auth, not JWT. `registerAuth` loads `request.user` from the `starter_session` cookie on every request (null when absent/invalid — never rejects by itself) and resolves the caller's permission set once, exposing `request.can(permission)`, `request.permissionSet`. `requireAuth`/`requirePermission(...keys)` are `preHandler` guards. Sessions are purged hourly (`MaintenanceService`). The first user ever to sign in becomes `owner` (advisory-locked against a race); everyone after gets the role bound to the `default` slot. Dev email login is gated by `DEV_LOGIN=true`; Google SSO is the real path (`routers/authRouter.ts` + `services/AuthService.ts`).
- **Access policy** (`domain/access.ts` + `services/AccessPolicyService.ts` + `repositories/access/`): THE authorization system, and the "feature flags". `resolvePermissions` is the ONLY place a role is read for auth — grepping `user.role ===` outside it should find only the reserved-owner check. A role's grant is the full list from `role_permissions` (a runtime role has no code default to be a delta of); per-USER rows are deltas layered on top. Two things are applied outside the data: an inactive account resolves to the empty set, and `owner` resolves to the whole catalog minus `ACCOUNT_SHAPED` (computed, never stored). Quotas (`role_limits` / `user_limit_overrides`) resolve the same way. `assertWithinLimit` is the single enforcement point for "how many". **`LIMITABLE_RESOURCES` and the `COUNT_SQL` map in `AccessPolicyRepository` must change in lockstep — the compiler enforces it.**
- **Project-scoped authorization** lives in `projectAuth.ts`: `loadProject`, `requireProjectMember`, `requireProjectPermission(...)`, `requireProjectOwner`. Fixed order on every project route — non-member 404, missing permission 403, archived 409, locked 423, owner bypass. API-key auth is refused outright on these routes. See `docs/projects-and-members.md`.
- Route bodies are validated with inline Fastify JSON Schema (`{ schema: { body: ... } }`), not a separate library. Add schema alongside new mutating routes.
- **Router file shape**: each handler is a module-level named `*Endpoint` function (typed via `FastifyRequest<{ Params/Body/Querystring }>`); the exported plugin body ONLY registers routes (path + options + handler). Services are reached through module-level lazy accessors (`const users = () => container.resolve(UserService)`) — the container is not ready at module load. See any file in `routers/`.
- **Conflict/race outcomes are sentinel return values, not exceptions** — a repository verb returns a `Result<T, E>` where `E` is a named literal union the router maps to an HTTP status (see `ReportRepository` and `conflicts.ts`).
- **Multi-step atomic mutations use `Database.transaction(cb)`**, threading the `QueryRunner` into each repo verb. **Inside the callback a `return` COMMITs — only a throw rolls back**, so a conflict sentinel returned from a branch that already wrote will commit that write.
- Build: `tsc --noEmit` (gate) then esbuild bundles to a single `dist/index.js`.

### Web (`web/src`)

Follows the `react-spa-app` skill: pages → modules → components/services/state, one zustand store assembled from per-domain slices, a modal registry, layout HOCs, singleton services, alias imports only (`state`, `types`, `hooks/*`, …). Key specifics:

- One store (`state/index.ts`) from slices: `alerts`, `auth`, `accessPolicy`, `notifications`, `moderation`, `users`, `projects`. Read one field per selector (`useStore(s => s.field)`), never `useStore(s => s)`.
- **Every JSON response is wrapped in the `@toolcase/base` REST envelope** — success `{ status: 'OK', data }`, failure `{ status: 'rejected', cause }` — applied server-side in one `preSerialization` hook (`api/src/http/envelope.ts`) and unwrapped in one place client-side (`helpers/api.ts`). `cause` is a machine code + params from `contracts/errors.ts` (`"limit_reached,projects,3"`); `helpers/api.ts` resolves it to copy through `strings.errors`, so the API never ships user-facing text. Handlers `return` bare objects. **A `curl` shows the envelope, so reach into `.data`.** Not enveloped: non-JSON bodies and 204s.
- `helpers/api.ts` (`apiFetch`) is the only thing that talks to the API. Services (`services/*Service.ts`) wrap it per domain; slices call services; modules call slices. Don't skip a layer.
- UI is `@toolcase/web-components` (`tc-*` custom elements). Since React 19 `className` on a custom element works; boolean props still need `|| undefined`.
- Auth/identity: `useAuth()` exposes `isOwner`/`isMember`/`isPaid` from server-provided SLOTS (roles are runtime data, so the client never knows role names). `useCan(permission)` gates ACTIONS. The paywall is `useLock`/`useLimitLock` + `configs/entitlements.ts` + `strings.upgrade` + `UpgradeModal`.
- Strings live in `configs/strings.ts` (typed as `AppStrings`), read via `useStrings()`. New copy goes there.
- Theme: the tc `sunshine` base theme retinted to a violet-on-neutral palette in `styles/app.scss` (it sets `--bs-primary: var(--sun-lead)`, so overriding the `--sun-*` tokens recolours everything). The one accent colour is `$brand` in `styles/_abstracts.scss` (and `AppBrand.tsx`). Light + system-dark supported via `prefers-color-scheme`.

### Migrations (`migrations/`)

Goose-managed SQL: `00001_schema.sql` (platform tables plus the console group — realms, projects, members, invites, vocabularies, assets, bundles, builds, configs, waitlist) and `00002_seed.sql` (roles, permissions, limits, plans, the local realm and the `project-invitation` email template — mirroring `SEED_ROLES`/`SEED_ROLE_BINDINGS`). `goose.sh` builds the DSN from `DATABASE_*` and runs `createdb` before `up`.

**Every table carries `created_at`, `updated_at` and `deleted_at` (soft delete) — no exceptions, join and log tables included.** Nothing is hard-deleted: a delete is `UPDATE … SET deleted_at = now(), updated_at = now()`, every read filters `deleted_at IS NULL` (including inside joins and subquery counts), every index is partial on that predicate, and inserts against a natural key revive the row with `ON CONFLICT … DO UPDATE SET deleted_at = NULL`. Because FK `ON DELETE CASCADE` never fires, a delete soft-deletes its children in the same data-modifying CTE (`delete-project.sql`, `delete-user.sql`). Full rule in the `migration-patterns` skill.

**Not in production — edit `00001`/`00002` in place rather than stacking migrations.** Every environment is rebuilt from scratch, so the schema stays one readable file; there is no backward compatibility to preserve. A local DB that already applied a migration will NOT pick up an in-place edit (goose tracks by filename) — rebuild it, then `npm run migrate`. (Derived projects that reach production switch to append-only migrations at that point.)

Backup tooling lives here too: `backup.sh` (pg_dump custom format), `restore-test.sh` (prove a dump restores into a scratch DB), `corrupt-drill.sh` (restore drill after deliberately corrupting a table) — all driven by the same `DATABASE_*` env vars.

### Deployment

Single Docker image (`Dockerfile`): multi-stage build compiles/bundles `api` only, fetches `goose`, and ships a runtime image running `docker-entrypoint.sh` (goose up, then `node dist/index.js`). The web build is deployed separately. `CORS_ORIGIN` switches the API between same-origin (unset) and cross-origin (set — enables the CORS hook and forces `SameSite=None; Secure` on the session cookie).

## Code practices

- **No semicolons, single quotes, 4-space indent** (both workspaces). No linter enforces it — match surrounding code.
- **Contracts first.** Add/change a shape in `api/src/contracts/` before wiring the route and the web side.
- **No ORM/query builder** — raw `pg`, SQL in `.sql` files next to the repository that owns them.
- **Ownership/authorization is a named predicate, not a policy engine** — a boolean function the handler calls and branches on.
- **No code comments** — the codebase is deliberately comment-free (the only comment-shaped lines kept are functional directives: `-- +goose` markers, `/// <reference` in `vite-env.d.ts`, shebangs). Do not add comments; put rationale in `docs/` instead.
- **No test suite exists, and none is to be added** — no unit/integration/e2e tests, no exceptions. `tsc --noEmit` is the only gate.
- **Verification is manual, against a running local stack** (Postgres locally or in Docker, `api`/`web`/`realm-stub` run locally — the stub is what makes upload → build → result exercisable). API changes: `curl` the changed endpoint (remember the envelope — pipe through `jq '.data'`). Frontend: exercise the affected screen in the browser at `localhost:6001`. The `verify` skill drives both servers end to end.
- `.claude/skills/` holds API references for the `@toolcase/*` libraries (`base`, `node`, `logging`) — consult them before reimplementing a helper those packages already provide — and pattern skills (`api-patterns`, `web-patterns`, `migration-patterns`) that encode the exact file shapes and checklists for each workspace; load the matching one before changing that workspace.

## Documentation policy — MANDATORY

`docs/` holds one markdown file per feature area, indexed by `docs/index.md`. Because this is a template, the docs ARE part of the product — derived projects inherit them as their starting documentation.

**Every change to this repository must update `docs/` in the same change:**

- Behaviour change in an existing feature area → update that feature's doc.
- New feature area → add `docs/<name>.md` and a row in `docs/index.md`.
- Removed/renamed behaviour → delete or fix the stale doc text.
- A change with genuinely no doc-visible effect (pure refactor, typo) is the only exception — and if you find yourself unable to say which doc a change belongs to, that is a signal the docs are missing a file.

Keep each doc scoped and cite concrete function/route names. Don't duplicate contract types into docs — point at `api/src/contracts/`.
