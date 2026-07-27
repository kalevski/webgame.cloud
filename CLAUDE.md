# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **template repository**: a full-stack app starter — a Postgres-backed Fastify API and a React 19 SPA, wired together and ready to build a product on. New projects are created FROM this repo; it is not itself a product. That has two consequences for every change made here:

1. **Keep it generic.** Anything added must be scaffolding most apps need, or part of the single worked example. Product-specific logic does not belong here — it belongs in the projects derived from this template.
2. **Keep it copyable.** Derived projects start as a copy of this repo (rename the `@appkit` scope, replace the example feature, set real env vars). Favour patterns that are easy to find, copy, and delete over clever indirection.

What ships:

- **Auth & sessions** — opaque cookie sessions, Google SSO, and a dev-only email login. The first account ever created becomes the `owner`.
- **User management** — an admin directory (list, create/pre-provision, activate/deactivate, impersonate) and self-serve account (rename, data export, hard delete, active-device list with per-session sign-out).
- **Roles & feature flags** — roles are database ROWS created at runtime, each granting a set of permission keys; per-account overrides layer on top; per-resource quotas (limits); behavioural "slots" (the default role, plus one slot per billing plan) bound to roles; and an entitlements/paywall system. This is the centrepiece — see *Access policy* below.
- **Subscriptions, invoices & product flags** — owner-managed plans (each `manual` = assigned by sales, or `managed` = payment gateway; they mix), per-user subscriptions, checkout/cancel/expiry, invoices (with a public printable page) and sales enquiries, both as filtered admin tables under the *Platform* nav group, and role sync — all behind a gateway-agnostic port registry (`domain/billing.ts`). No payment provider is attached: manual plans show a contact-sales screen, managed plans say upgrades are unavailable until a port is registered. The whole slice sits behind the `billing` product flag. Product flags are workspace-wide on/off switches toggled in `/admin/settings` — distinct from the per-account capability flags above.
- **Notifications** — an in-app bell inbox plus web push.
- **Command palette** — ⌘K / Ctrl+K (`modules/CommandPalette.tsx`, hint in the dashboard navbar) with permission-gated route jumps, quota-aware actions, and route-contextual commands. Scoped to the projects/tasks example — extend `items` for a real feature.
- **Email** — behind the `email` product flag: a provider port (log / SMTP / Mailchimp-Mandrill), a template editor with `{{placeholder}}` rendering, audit-action → transactional-mail triggers, scheduled/bulk campaigns, and a queue worker (`EmailWorker`) that claims batches with `FOR UPDATE SKIP LOCKED`, retries with backoff and never blocks a request.
- **Moderation & audit** — a reports queue and an append-only audit log of every consequential action by any account (sign-in/out, account changes, feature writes, billing, admin writes), filterable by account, action and date.
- **API keys** — `Authorization: Bearer ak_…` tokens issued per account (managed at `/admin/api-keys`, stored under `/api/account/api-keys`), hashed at rest and shown once. Scopes are intersected with the owner's live permission set, so a key can never outrank the account and narrows the moment the role does (`docs/api-keys.md`).
- **Outbound webhooks** — HMAC-SHA256 signed POSTs of every audited action, fanned out from `recordAudit` and delivered by the job queue with retries. The audit action list IS the event catalog — no second registry (`docs/webhooks.md`).
- **Platform hardening** — CSP/HSTS and the rest of the security-header set, a CSRF `Origin` guard on mutating requests, DB-backed rate limits on the abusable routes, optional `Idempotency-Key` replay, `x-request-id` end to end, `/api/health` + `/api/ready` + `/api/version`, and Postgres `LISTEN`/`NOTIFY` access-policy invalidation across instances (`docs/platform-hardening.md`).
- **Background jobs** — a durable `jobs` queue drained by `JobWorker` (`FOR UPDATE SKIP LOCKED`, retry with backoff), plus cron scheduling declared next to the handler (`registerJobHandler(kind, fn, { cron })`, validated at boot by `cron-parser`). A 60s sweep enqueues the current occurrence keyed `<kind>:<occurrenceISO>`, so re-sweeping is idempotent. `/admin/jobs` is a read-only view of the schedules with per-job and run-all "run once now" triggers.
- **Pagination** — admin tables page by `offset` (page numbers); the four unbounded tables (audit log, email outbox, jobs, webhook deliveries) also accept `?cursor=`, a keyset on `(created_at, id)` that does not drift when rows are inserted mid-paging (`repositories/pagination.ts`, `docs/pagination.md`).
- **Data retention** — every table is discovered from the schema (any table with `deleted_at`) and listed in `/admin/retention` with a per-table "keep soft-deleted rows for N days"; a `PurgeWorker` running beside the API hard-deletes them in bounded batches on a configurable interval (batch size, tables per run, seconds between runs). Defaults to `0` = keep forever for everything except the noisy operational tables, so enabling it never silently destroys data.
- **File storage** — behind the `files` product flag: admin-managed upload sources (local disk or an S3-compatible bucket, any number of each) behind a gateway-agnostic port registry (`domain/storage.ts`), and a code-defined, admin-bound file-type → source mapping (`FILE_TYPES` in `contracts/files.ts`) so application code uploads by type (`FileService.upload('profile_picture', ...)`) without knowing where bytes land.
- **Example feature: Projects & Tasks** — an owned parent/child resource demonstrating the full stack (contract → router → service → repository → SQL → slice → service → module → page) with ownership checks, capability gating (`project.write`/`task.write`), a paid capability (`project.export`), and quota gating (`projects`/`tasks`). **To build a new feature, copy this example end to end** — it is deliberately small and touches every layer. In a derived project it is also the thing you delete/replace first.

All user-facing copy is **English**, read through `configs/strings.ts` (there is no runtime i18n layer, but the indirection makes translation a single-file change).

npm workspaces monorepo: `api` (Fastify + pg), `web` (Vite + React 19 SPA), `migrations` (goose SQL). Package scope is `@appkit`.

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
npm run dev         # api (tsx watch, :5000) + web (vite, :5001)
```

Config comes from a single root `.env` (gitignored; `.env.example` is the committed template). No `dotenv` dependency — the API passes `--env-file-if-exists=../.env` to `tsx`, and the migration/backup shell scripts source `migrations/env.sh`. Shell variables win over file values in both loaders. See `docs/local-development.md`.

Then open `http://localhost:5001`. The `dev:api` script sets `DEV_LOGIN=true`, so sign in with any email via the dev login form — **the first sign-in becomes the `owner`**. Dev login is auto-disabled if any OAuth provider is configured (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` or `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` — SSO takes over). Vite proxies `/api` to `127.0.0.1:5000`, so no CORS setup is needed locally.

Health check: `curl localhost:5000/api/health`.

## Commands

Run from repo root unless noted.

```bash
npm run dev                 # concurrently: api + web
npm run dev:api             # api only — DEV_LOGIN=true tsx watch src/index.ts
npm run dev:web             # web only
npm run build               # tsc --noEmit + build, in every workspace that has a build script
npm run typecheck           # tsc --noEmit in every workspace
```

There is no test suite or lint script — `typecheck` and `build` (which runs `tsc --noEmit` as a gate before bundling) are the only automated checks. Two profilers run on demand through `npx` (Node 24, never added as dependencies): `npx react-doctor web` must report 0 diagnostics (suppressions live in `web/doctor.config.json`), and `npx clinic doctor` profiles the built API bundle under load — see `docs/local-development.md`. **Do not write unit, integration, or e2e tests** — see Code practices.

Migrations (workspace `@appkit/migrations`):

```bash
npm run migrate                        # from root: createdb + apply pending
npm run down -w @appkit/migrations     # roll back latest
npm run status -w @appkit/migrations   # applied/pending
npm run create -w @appkit/migrations --name=add_thing   # scaffold new migration
npm run backup -w @appkit/migrations         # pg_dump -Fc to a timestamped .dump
npm run restore-test -w @appkit/migrations   # restore a dump into a scratch DB to prove it
npm run corrupt-drill -w @appkit/migrations  # restore drill that corrupts a table first
```

Env vars the API reads (`api/src/env.ts`, defaults in parens): `PORT` (5000), `DATABASE_HOST` (localhost), `DATABASE_PORT` (5432), `DATABASE_USER` (OS user), `DATABASE_PASS` (none), `DATABASE_NAME` (starter), `DATABASE_SSLMODE` (disable), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`, `DEV_LOGIN`, `CORS_ORIGIN`, `WEB_URL`, `API_URL`, `WORKSPACE_NAME` (AppKit), `LOG_LEVEL` (info), `DEBUG`.

### TypeScript 7

The repo is on **TypeScript 7** (the native Go port), so `tsc` is a platform binary delivered via optional deps (`@typescript/typescript-<platform>`), not JS. Consequences: typecheck is fast and needs no Node to run; `baseUrl` is gone (TS5102) so `web/tsconfig.json` relies on `paths` alone (every mapping is `./`-prefixed); `tsc` is typecheck-only (`api` bundles with esbuild, `web` with Vite); decorators work via esbuild/tsx reading `experimentalDecorators`, but `emitDecoratorMetadata` is NOT implemented by esbuild — tsyringe works only because every constructor param carries an explicit `@inject(Token)`. **Adding an un-`@inject`ed constructor param fails at runtime, not at build.**

## Architecture

### Shared contract (`api/src/contracts/`)

The single source of truth for every cross-cutting type, split into files re-exported from `index.ts` (a barrel). Dependency-free — no server imports — so `web` imports it via the `@appkit/api/contracts` subpath (`api/package.json` `exports` field) without pulling in Fastify/pg. When adding or changing an API shape, edit the matching file here first; both sides key off it.

- `permissions.ts` — `PERMISSIONS` (the capability catalog), `Permission`, `ACCOUNT_SHAPED`, `UserRole`.
- `roles.ts` — `Role`, `RoleSlot`/`ROLE_SLOTS`, `RoleBindings`, `SEED_ROLES`, `SEED_ROLE_BINDINGS`, `OWNER_ROLE_ID`, `toRoleId`.
- `limits.ts` — `LIMITABLE_RESOURCES`, `RESOURCE_LABELS`, `AccessPolicy`, `LimitMap`, `ResolvedLimits`, per-user override shapes.
- `users.ts` — `User`, `AuthSession`, `AuthConfig`, `AccountExport`, `PlatformSettings`, `AdminOverview`.
- `notifications.ts` — `AppNotification`, `NOTIFICATION_KINDS`, `Report`/`REPORT_TARGET_KINDS`, `AuditEntry`.
- `projects.ts` — the example feature: `Project`, `Task` + drafts.
- `files.ts` — `FILE_SOURCE_TYPES`, `FileSource`/`FileSourceDraft`, `FILE_TYPES`/`FILE_TYPE_LABELS` (the hand-maintained file-type enum), `FileTypeBindings`, `StoredFile`.
- `errors.ts` — the machine-readable error vocabulary: `API_ERROR_CODES`, `encodeErrorCause`/`parseErrorCause`. A rejected `cause` is always a code plus comma-joined params (`limit_reached,projects,3`), never display copy — the web renders the sentence from `strings.errors`.

### API (`api/src`)

Layering: `routers/*Router.ts` (Fastify plugins) → `services/*Service.ts` → `repositories/<domain>/<X>Repository.ts` → `Database.ts`. tsyringe DI is wired in `container.ts`; boot is `index.ts` → `http.ts`. SQL lives in `.sql` files imported as strings (esbuild inlines them; `sql.d.ts` declares the module type); row types are in `schema/*.ts`. In dev, tsx loads `api/sql-hooks.mjs` (via `--import ./sql-hooks-register.mjs`), which both loads `.sql` files and pins `@toolcase/*` imports to their ESM builds — tsx otherwise resolves their CJS builds, whose named exports fail to parse; esbuild and plain node resolve the ESM builds natively, so `import { x } from '@toolcase/...'` works everywhere directly.

**Boot lives in `http.ts`, not `index.ts`.** `index.ts` is a small entrypoint (env, container, start/stop); `http.ts` holds the server class and registers, in order: a CORS header hook (only when `CORS_ORIGIN` is set), a CSRF `Origin` guard (rejects cross-site mutating requests — the comment block there has the reasoning), `registerEnvelope`, `registerAuth`, then every plugin from the flat `ROUTE_PLUGINS` array, then a global error handler mapping Fastify validation errors to 400 and everything else to a logged 500.

- **Logging**: two loggers on purpose. Fastify's built-in pino owns per-REQUEST logs; `logging.ts` (`@toolcase/logging`) is the app/process logger — boot (`index.ts`), background sweeps (`MaintenanceService`), and repository timings. `LOG_LEVEL` sets the threshold; `DEBUG=<scope patterns>` (e.g. `DEBUG=repo`) widens single scopes to debug. Every repository extending `BaseRepository` passes `repositoryOptions` from `logging.ts` — a query ≥250ms logs a warning, `DEBUG=repo` shows every timed verb.
- **Auth** (`auth.ts`): opaque session-cookie auth, not JWT. `registerAuth` loads `request.user` from the `starter_session` cookie on every request (null when absent/invalid — never rejects by itself) and resolves the caller's permission set once, exposing `request.can(permission)`, `request.permissionSet`. `requireAuth`/`requirePermission(...keys)` are `preHandler` guards. Sessions are purged hourly (`MaintenanceService`). The first user ever to sign in becomes `owner` (advisory-locked against a race); everyone after gets the role bound to the `default` slot. Dev email login is gated by `DEV_LOGIN=true`; Google SSO is the real path (`routers/authRouter.ts` + `services/AuthService.ts`).
- **Access policy** (`domain/access.ts` + `services/AccessPolicyService.ts` + `repositories/access/`): THE authorization system, and the "feature flags". `resolvePermissions` is the ONLY place a role is read for auth — grepping `user.role ===` outside it should find only the reserved-owner check. A role's grant is the full list from `role_permissions` (a runtime role has no code default to be a delta of); per-USER rows are deltas layered on top. Two things are applied outside the data: an inactive account resolves to the empty set, and `owner` resolves to the whole catalog minus `ACCOUNT_SHAPED` (computed, never stored). Quotas (`role_limits` / `user_limit_overrides`) resolve the same way. `assertWithinLimit` is the single enforcement point for "how many". **`LIMITABLE_RESOURCES` and the `COUNT_SQL` map in `AccessPolicyRepository` must change in lockstep — the compiler enforces it.**
- **Ownership pattern**: owned rows carry `ownerId`. Route handlers gate mutation with a local named predicate — `user.role === OWNER_ROLE_ID || row.ownerId === user.id` (see `canEditProject` in `routers/projectRouter.ts`). Follow this rather than inventing a new authorization shape. Capability check first (`request.can(...)`), ownership check second.
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

Goose-managed SQL: `00001_schema.sql` (generic tables + the projects/tasks example) and `00002_seed.sql` (roles, permissions, limits, slot bindings — mirroring `SEED_ROLES`/`SEED_ROLE_BINDINGS`). `goose.sh` builds the DSN from `DATABASE_*` and runs `createdb` before `up`.

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
- **Verification is manual, against a running local stack** (Postgres locally or in Docker, `api`/`web` run locally). API changes: `curl` the changed endpoint (remember the envelope — pipe through `jq '.data'`). Frontend: exercise the affected screen in the browser at `localhost:5001`. The `verify` skill drives both servers end to end.
- `.claude/skills/` holds API references for the `@toolcase/*` libraries (`base`, `node`, `logging`) — consult them before reimplementing a helper those packages already provide — and pattern skills (`api-patterns`, `web-patterns`, `migration-patterns`) that encode the exact file shapes and checklists for each workspace; load the matching one before changing that workspace.

## Documentation policy — MANDATORY

`docs/` holds one markdown file per feature area, indexed by `docs/index.md`. Because this is a template, the docs ARE part of the product — derived projects inherit them as their starting documentation.

**Every change to this repository must update `docs/` in the same change:**

- Behaviour change in an existing feature area → update that feature's doc.
- New feature area → add `docs/<name>.md` and a row in `docs/index.md`.
- Removed/renamed behaviour → delete or fix the stale doc text.
- A change with genuinely no doc-visible effect (pure refactor, typo) is the only exception — and if you find yourself unable to say which doc a change belongs to, that is a signal the docs are missing a file.

Keep each doc scoped and cite concrete function/route names. Don't duplicate contract types into docs — point at `api/src/contracts/`.
