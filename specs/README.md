# WebGame Cloud — implementation specs

One spec per proposal document in `proposal/`. Each is written to be implemented without re-deriving
a decision: tables, contracts, endpoints, components and a file manifest, all resolved against this
repo's pattern skills (`migration-patterns`, `api-patterns`, `web-patterns`, `web-components`).

`specs/` is a working directory. The implementing change still owes `docs/` updates per CLAUDE.md —
the docs files are listed in each manifest.

| # | Spec | Proposal source | Ships |
| --- | --- | --- | --- |
| 07 | [Storage, quotas and plans](07-storage-and-quotas.md) | `proposal/07-storage-and-quotas.md` | The limit plumbing every other spec calls |
| 05 | [Realms and the project lock](05-build-machine.md) | `proposal/05-build-machine.md` | `realms`, `project_migrations`, the realm trust boundary |
| 01 | [Projects, members and permissions](01-projects-and-permissions.md) | `proposal/01-projects-and-permissions.md` | `projects` rewritten, membership, invites, vocabularies |
| 02 | [Asset files](02-asset-files.md) | `proposal/02-asset-files.md` | `files`, direct-to-realm upload, the orphan reaper |
| 03 | [Bundles](03-bundles.md) | `proposal/03-bundles.md` | `bundles` — a saved tag query |
| 04 | [Builds](04-builds.md) | `proposal/04-builds.md` | `builds`, `build_files`, the realm job protocol |
| 06 | [Config data](06-config-data.md) | `proposal/06-config-data.md` | `config_schemas`, `configs`, `config_versions`, the public read surface |
| 08 | [Landing page](08-landing-page.md) | `proposal/08-landing-page.md` | The public marketing route + waitlist |

[`00-gaps.md`](00-gaps.md) is the record of the 44 gaps found by reading these specs against the repo
as it stands. Every one is now answered inside the spec it belongs to; that file is the index of where
each answer landed, plus six deliberate follow-ups that defer work rather than block it.

**Build order is the table order** — 07 first (nothing can enforce a quota until the limit plumbing
is split), 05 second (project creation needs a realm to pin to), then 01, and the rest in dependency
order. 08 is independent and can be built at any point.

**07, 05 and 01 land as one change.** They are mutually referential — 07's `count-members.sql` and
`sum-storage-bytes.sql` read tables 01 and 02 create, 07's `assertWithinProjectLimit(project, …)` takes
the project row 01 defines, and 01's create path calls 05's `selectRealm` — so none of the three can
be green (`npm run typecheck` + `npm run migrate` + a manual pass) on its own. 02, 03, 06, 04 and 08
each land individually and green. The order inside the combined change is still 07 → 05 → 01; only the
gate is shared.

---

## Shared decisions

Every spec below assumes these. They are decided once here rather than repeated eight times.

### D1 — The example feature is replaced, not extended

`projects`/`tasks` is the template's worked example. WebGame Cloud's project is a different entity
with the same name, so:

- **`tasks` is deleted end to end** — table, `contracts/projects.ts` types, repository, service verbs,
  routes, slice fields, modules, `task.write` permission, `tasks` from `LIMITABLE_RESOURCES` +
  `COUNT_SQL` + `count-tasks.sql`, and its `role_permissions` seed rows.
- **`projects` is rewritten in place** — same table name, new columns (`realm_id`, `icon`, `color`,
  `app_type`, `archived_at`, `default_category_id`), and `visibility`/`priority`/`due_date`/
  `notify_on_activity` dropped. `project.share` and `project.export` go with them (and their
  `ENTITLEMENTS` entry).
- `PROJECT_LIMIT_ENTITLEMENT` in `configs/entitlements.ts` survives — the project quota is still the
  paywall's worked example.

The web files that carry the example do not match their spec-manifest names, so the list is fixed here
once: **deleted** — `modules/ProjectRoadmap.tsx`, `modals/CreateTaskModal.tsx`,
`modals/ConfirmDeleteTaskModal.tsx`, `modals/ManageAccessModal.tsx` (the `project.share` UI).
**Rewritten in place, keeping their route names** — `modules/ProjectList.tsx`, `ProjectDetail.tsx`,
`ProjectSettings.tsx`, `pages/ProjectsPage.tsx`, `ProjectDetailPage.tsx`,
`modals/CreateProjectModal.tsx`, `ConfirmDeleteProjectModal.tsx`. **Rebuilt for the console
vocabulary** — `modules/CommandPalette.tsx` (it references `task.write` today and will not typecheck
otherwise): jump to project, upload assets, run build, open config.

`CLAUDE.md` is rewritten in the same change that lands 07+05+01: this repo stops being a generic
template and becomes WebGame Cloud. The template lineage survives as a paragraph of history, not as a
review constraint.

### D2 — Two permission planes, deliberately separate

| Plane | Where it lives | Resolved by | Example keys |
| --- | --- | --- | --- |
| **Platform** | `PERMISSIONS` in `contracts/permissions.ts`, granted by roles + per-user deltas | `resolvePermissions` (`domain/access.ts`), `request.can(...)` | `project.create`, `realm.write`, `admin.project.move` |
| **Project** | `PROJECT_PERMISSIONS` in a new `contracts/projectAccess.ts`, stored as a `text[]` on `project_members` | `resolveProjectPermissions` (new `domain/projectAccess.ts`), `request.canInProject(...)` | `member.manage`, `file.write`, `build.run` |

Project permissions are **row data, not role grants** — they must never enter `PERMISSIONS`, the
admin role editor, or `SEED_ROLES`. The two planes compose: a request first passes the platform guard
(`requireAuth`, sometimes `requirePermission`), then the project guard.

The two key spaces overlap by prefix on purpose (`file.upload`/`file.source.*` are platform,
`file.write` is project; `project.create` is platform, `project.settings` is project), so
`contracts/projectAccess.ts` closes the door with a compile-time guard rather than a convention:

```ts
type NoOverlap = ProjectPermission & Permission extends never ? true : never
export const PLANES_ARE_DISJOINT: NoOverlap = true
```

**API keys cannot act inside a project in v1.** `Authorization: Bearer ak_…` intersects scopes with the
caller's *platform* set only, and the project guard has no key representation — so `projectAuth.ts`
rejects key-authenticated requests outright (`403 forbidden`) rather than letting them pass unchecked.
Project-scoped keys (a `project:<id>` restriction plus a `ProjectPermission[]` scope, for CI upload and
build triggering) are a specced follow-up, not a v1 omission to be discovered in production.

Platform permission changes:

- **Added**: `project.create`, `realm.read`, `realm.write`, `admin.project.read`,
  `admin.project.move`, `waitlist.read`.
- **Removed**: `project.write`, `project.share`, `project.export`, `task.write`.

`project.create` is granted to the default-slot role and every paid-slot role in `SEED_ROLES`; the
`realm.*`/`admin.project.*`/`waitlist.read` keys are staff-only (owner resolves the whole catalog
computationally, so they need no seed row unless a moderator role should hold them — spec 05 decides).

Two couplings ride along and are easy to forget:

- The first dot segment of a permission key is the group the admin role editor renders — `realm.` and
  `waitlist.` are new prefixes and each needs a `strings.accessAdmin.groups` label in
  `web/src/configs/strings.ts`.
- Every literal added to `API_ERROR_CODES` needs copy in `ERROR_MESSAGES` in the same file. That one is
  typecheck-enforced (`satisfies Record<ApiErrorCode | 'fallback', …>`), so it fails loudly — unlike the
  group label, which just renders an empty heading.

### D3 — One project request shape

New file `api/src/projectAuth.ts`, modelled on `auth.ts`, decorating the request inside the project
routers:

```ts
request.project              // ProjectRow, loaded once per request
request.projectPermissions   // Set<ProjectPermission>
request.canInProject(key)    // boolean
```

Exports three preHandlers: `loadProject`, `requireProjectMember`, `requireProjectPermission(...keys)`.
The order they enforce is fixed and is the same on every project-scoped route:

1. Not a member → **404** `project_not_found`. Never 403 — a non-member cannot probe for existence.
2. Member without the permission → **403** `forbidden`.
3. Mutating method (`POST`/`PUT`/`PATCH`/`DELETE`) while a non-terminal `project_migrations` row
   exists → **423** `project_locked`. Reads pass.
4. Mutating method while `projects.archived_at IS NOT NULL` → **409** `project_archived`. Same
   preHandler, same shape as the lock: an archived project is read-only, not hidden.
5. Project owner (`projects.owner_id`) implicitly holds every project permission; the platform
   `OWNER_ROLE_ID` account does too (support access), and every such bypass is audited.

**The lock and the archive flag bind console traffic only.** Realm-facing routes (`/api/realm/*`,
`/api/internal/*`) are exempt — a finalize is the completion of a write the platform already
authorised, and refusing it strands bytes the orphan reaper then deletes. Builds are *not* claimable
while a project is locked (`claim` filters the migration out), and the public read surface never stops
serving. Both facts are restated where they bite, in specs 02 and 04.

### D4 — Limits split into two scopes

`LIMITABLE_RESOURCES` grows and is partitioned. `contracts/limits.ts`:

```ts
export const ACCOUNT_LIMITED = ['projects', 'storage_mb'] as const
export const PROJECT_LIMITED = ['bundles_per_project', 'configs_per_project', 'members_per_project'] as const
export const LIMITABLE_RESOURCES = [...ACCOUNT_LIMITED, ...PROJECT_LIMITED] as const
```

`AccessPolicyRepository` keeps `COUNT_SQL: Record<AccountLimitedResource, string>` (`$1` = user id)
and gains `PROJECT_COUNT_SQL: Record<ProjectLimitedResource, string>` (`$1` = project id) — both typed
maps, so the compiler still forces one `count-*.sql` per resource. `AccessPolicyService` gains
`assertWithinProjectLimit(project, resource)`, which resolves the ceiling from the **project owner's**
plan, never the caller's. Storage is special-cased in spec 07 (`assertStorageHeadroom`).

The union is load-bearing beyond quota checks, so the split runs all the way through the types:

- **Ceilings** (`role_limits`, `user_limit_overrides`, `LimitMap`, the admin role editor and the
  per-account override editor) keep the **full** union — all five are per-plan numbers, and staff may
  override any of them for one account.
- **Usage** narrows to `AccountLimitedResource`: `ResolvedLimits`, `countAll(userId)` and
  `UserAccessPayload.usage` cannot express a project-scoped count keyed by user. Project usage travels
  on the project payload and on `GET /api/projects/:id/usage`.

**Downgrades never destroy or lock data.** When a plan change (or a staff override) drops a ceiling
below current usage, existing resources are grandfathered: reads, edits and deletes keep working,
only *creates* and *uploads* refuse, and the usage panel shows the overage. Nothing sweeps the excess.

### D5 — The realm trust boundary

Realms are servers outside this application. Two independent trust directions:

- **API → realm** is asymmetric-signed. `SIGNING_KEYS` in `contracts/signing.ts` gains
  `'realm_upload'` and `'realm_transfer'` (plus `SIGNING_KEY_LABELS` entries). The existing
  `SigningKeyService` + `signingRouter` already own generation, rotation, `kid` headers and public-key
  publication — reuse them, add nothing.
- **Realm → API** is a per-realm bearer token: `realms.token_hash`, generated on realm create, shown
  once, hashed at rest, mirroring `ApiKeyService`. The `/api/realm/*` and `/api/internal/*` routes
  authenticate with it and with nothing else — no session, no cookie, no CSRF origin check.

Never issue one key for both directions: an upload receiver must not be able to validate a
data-relocation instruction.

### D6 — The public game surface is not enveloped

The game-runtime routes (config reads, asset manifests, the waitlist POST) are consumed by shipped
games and cached by CDNs, so they return bare JSON with explicit `Cache-Control`. This is the **only**
exception to the envelope rule in the codebase; it is documented in `docs/game-runtime-api.md`.

There is no passthrough list in `http/envelope.ts` today to add to, and a URL-prefix list is the wrong
mechanism — `/api/public/constants` already exists (`routers/billingRouter.ts`), is already enveloped,
and is already read through `apiFetch` by the web `BillingService`; a `/api/public` prefix rule would
silently break the landing page's pricing figures. The opt-out is therefore **per route**:

```ts
app.get('/api/public/projects/:id/configs/:key', { config: { envelope: false } }, handler)
```

`registerEnvelope` reads `request.routeOptions.config?.envelope === false` and returns the payload
untouched. Route-level config survives renames and reads at the call site; a prefix list does neither.
`/api/public/constants` keeps its envelope exactly as it is today — it is a console-consumed endpoint
that merely happens to be unauthenticated.

### D7 — Background work

Internal periodic work uses the existing durable queue and cron declaration
(`registerJobHandler(kind, fn, { cron })`): the orphan reaper (spec 02), the migration driver
(spec 05), stale-build reaping (spec 04), and the byte reaper below. External heavy work is **not** a
`jobs` row — the realm long-polls and claims from the `builds` table directly with
`FOR UPDATE SKIP LOCKED`, because the claim, the status and the result all belong to the build row the
user is watching.

**Deleting a row must delete the bytes.** Soft-deleting an asset, a build or a whole project leaves
files on a realm that nothing would ever remove — and because storage usage counts only live `ready`
rows, delete-and-re-upload would otherwise consume unbounded realm disk while staying under quota.
Every delete path therefore enqueues `realm.purge` (`{ realmId, paths[] }`), delivered over the same
signed-instruction channel as the migration and retried by the job queue. Spec 05 owns the job and the
protocol; specs 01, 02 and 04 enqueue it. Realm-side reconciliation against a platform manifest is a
v2 backstop, not a v1 requirement.

### D8 — Feature flags and side effects

- `FEATURE_FLAGS` is untouched — the console is the product, not an optional slice. `billing` must be
  **on** for plans/quotas to resolve, and `FEATURE_FLAG_DEFAULTS` ships it `false`, so `00002_seed.sql`
  writes the `feature_billing` setting **on**. With billing switched off on a live workspace, quotas
  resolve from the default-slot role's `role_limits` and staff overrides are ignored — never
  unlimited, because "turn billing off" must not be a way to buy an unlimited plan. `email` must be on
  for email invites (spec 01 refuses an invite it cannot deliver when it is off).
- `NOTIFICATION_KINDS` becomes `['welcome', 'system', 'project_invite', 'project_moved', 'build_failed']`
  — and the `notifications.kind` CHECK in `00001_schema.sql` changes in the same edit (contract-union ↔
  CHECK lockstep).
- Audit: every membership change, permission change, ownership transfer, realm move, build-tag move,
  purge and project delete calls `recordAudit`, fire-and-forget. The audit action list is also the
  webhook event catalog — no second registry.
- `recordAudit(actor: User, …)` dereferences `actor.id`/`actor.name` today, and three new callers have
  no user: the waitlist signup (spec 08), realm-driven build results and migration transitions (specs
  04/05), and the cron reapers. Its first parameter becomes `User | null`, and a null actor is written
  as the synthetic id `system` with name `System`. Null must be safe in all three fan-outs —
  `AuditRepository.record`, `WebhookService.queueForAction` and `EmailService.handleAuditEvent` — and
  the `/admin/audit` account filter renders `System` like any other actor.

### D9 — Game assets are the `assets` table, not `files`

`00001_schema.sql` already defines a `files` table for the admin file-storage slice (`file_type`,
`source_id`, `location`, `owner_id`, `size`) with `files_owner_idx` / `files_type_idx`, backing avatars
and other source-bound uploads. Game assets are a different entity with a different lifecycle, so they
take a different name — **`assets`**, with `assets_*` indexes, `contracts/assets.ts`,
`schema/assets.ts`, `repositories/assets/` and `AssetFileRepository`. The admin slice, the `files`
product flag, `FILE_TYPES` and `FileService` are left exactly as they are; they still serve the things
that must not live on a realm (avatars, invoice PDFs). Spec 07's `sum-storage-bytes.sql` sums
`assets.size_bytes`, never `files.size` — the two never mix in a quota.

### D10 — Retention and paging cover the new tables

`/admin/retention` discovers every table carrying `deleted_at`, so all fourteen new tables appear the
moment they exist. Each spec adds `TABLE_LABELS` entries in `contracts/retention.ts` for the tables it
creates, and `RETENTION_DEFAULTS` stays at `0` (keep forever) everywhere except `project_migrations`
(90 days — a finished migration is a log line) and `builds`/`build_files` (0, because purge-untagged is
the user-facing control and a silent sweep would delete a tagged release).

`builds` is an unbounded table on an active project, so it takes `?cursor=` keyset paging on
`(created_at, id)` alongside `offset` (`repositories/pagination.ts`), like the four unbounded tables
that already have it.

### D11 — A stub realm ships with the repo

Specs 02, 04 and 05 all verify against a realm that receives `PUT`s, claims builds and posts results,
and this repo has no test suite — a manual pass against a running stack is the only gate. So a fourth
npm workspace, `@appkit/realm-stub`, ships **dev-only** and is what `00002_seed.sql`'s `local` realm
row points at (`http://127.0.0.1:5100`): it verifies the `realm_upload` JWT against the published
public key, writes bytes to a temp directory, calls `/api/internal/uploads/:id/finalize`, long-polls
`/api/realm/jobs/next`, and returns a canned build result with plausible `build_files`. It is not the
realm — it is the smallest thing that makes the protocol exercisable, and `npm run dev` starts it
beside `api` and `web`.

### D12 — Double-submit protection on the two expensive creates

The template already supports optional `Idempotency-Key` replay. Two new routes opt in, because both
charge a quota and both are one click away from being sent twice: `POST /api/projects` (two projects,
two quota charges, two realm assignments) and `POST /api/projects/:id/bundles/:bundleId/builds` (two
builds, two realm jobs, doubled realm load). Uploads do not need it — they are already keyed by
`upload_uuid`.

### D13 — An account that owns projects cannot be hard-deleted

The template ships a self-serve hard account delete. `projects.owner_id` is `ON DELETE CASCADE`, but
because nothing is ever hard-deleted the cascade never fires, so a naive deletion would strand
projects, memberships, assets and realm bytes owned by a user who no longer exists. Account deletion
is therefore **refused** while the account owns any live project, with an error naming the count and
the UI pointing at *Transfer ownership*. Membership of someone else's project is not a blocker — those
rows are soft-deleted with the account.

### D14 — Conventions that need no restating

Ids are app-generated `text` PKs (`randomUUID()` in the repository). Every table carries
`created_at`/`updated_at`/`deleted_at`; deletes are soft; every index is partial on
`deleted_at IS NULL`; children are soft-deleted in the parent's data-modifying CTE. Both migration
files are edited **in place**, then `dropdb starter && npm run migrate`. No tests — `npm run typecheck`
plus a manual pass is the gate.
