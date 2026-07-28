# Realms and the project lock

> Source: `proposal/05-build-machine.md`. Shared decisions: [`README.md`](README.md).
> Build second — project creation cannot commit without a realm to pin to.

## Requirement

A **realm** is a build machine outside this application: it receives uploaded bytes, processes them and
runs builds. The platform registers realms, assigns exactly one to each project (tier-aware,
capacity-aware, least-loaded, never an `exclusive` one automatically), lets staff move a project to any
realm by hand, and guards the move with a **project lock** — a `project_migrations` row whose existence
makes every mutating request on that project return `423`. Instructions to realms are JWTs signed with
the `realm_transfer` key; realms authenticate back with a per-realm bearer token.

## Scope

- `realms` + `project_migrations` tables; `projects.realm_id`.
- `RealmService`: registry CRUD, `selectRealm(ownerId)`, `moveProject(projectId, toRealmId, actor)`,
  heartbeat ingest.
- The `realm.purge` job — the one path that deletes bytes off a realm (D7), enqueued by specs 01, 02
  and 04.
- `@appkit/realm-stub`, the dev-only workspace that makes the whole protocol exercisable (D11).
- The `realm_upload` / `realm_transfer` signing keys (issued here, consumed by specs 02 and 04).
- Realm-authenticated route group `/api/realm/*` (heartbeat, job claim, status/result — the last two
  specced in 04) and `/api/internal/*` (upload finalize — specced in 02).
- The migration state machine driven by a job handler, re-enqueued at boot.
- Staff screens: realm registry `/admin/realms`, move-project action in the admin project directory.
- The developer-facing locked banner and the client-side lock poll.

## Non-goals

- The realm itself. This repo specs the platform side only: the worker's compression queue, replay
  cache, dead-letter store and disk-health reporting live in that separate service. `@appkit/realm-stub`
  is not that service — it is the smallest thing that answers the protocol so a developer can complete
  an upload → build → result loop locally, and it is never deployed.
- No byte copying by the API. The platform issues an instruction and repoints; realms transfer between
  themselves.
- No automatic realm provisioning or autoscaling — realms are staff-created rows.

## Data model

`00001_schema.sql`, new group after `settings`, before `projects` (projects references it):

```sql
CREATE TABLE realms (
    id           text PRIMARY KEY,
    name         text NOT NULL,
    base_url     text NOT NULL,
    region       text NOT NULL DEFAULT '',
    plan_id      text REFERENCES billing_plans(id) ON DELETE SET NULL,
    exclusive    boolean NOT NULL DEFAULT false,
    status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draining', 'offline')),
    token_hash   text NOT NULL,
    disk_free_bytes bigint NOT NULL DEFAULT 0,
    queue_depth  integer NOT NULL DEFAULT 0,
    health       text NOT NULL DEFAULT 'unknown' CHECK (health IN ('unknown', 'healthy', 'degraded', 'unhealthy')),
    last_seen_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE UNIQUE INDEX realms_name_idx ON realms (name) WHERE deleted_at IS NULL;
CREATE INDEX realms_assignable_idx ON realms (status) WHERE NOT exclusive AND deleted_at IS NULL;

CREATE TABLE project_migrations (
    id             text PRIMARY KEY,
    project_id     text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_realm_id  text REFERENCES realms(id) ON DELETE SET NULL,
    to_realm_id    text NOT NULL REFERENCES realms(id) ON DELETE RESTRICT,
    state          text NOT NULL DEFAULT 'exporting'
                   CHECK (state IN ('exporting', 'importing', 'repointing', 'purging', 'completed', 'failed')),
    actor_id       text REFERENCES users(id) ON DELETE SET NULL,
    error          text NOT NULL DEFAULT '',
    started_at     timestamptz NOT NULL DEFAULT now(),
    finished_at    timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);
CREATE UNIQUE INDEX project_migrations_lock_idx ON project_migrations (project_id)
    WHERE state NOT IN ('completed', 'failed') AND deleted_at IS NULL;
CREATE INDEX project_migrations_project_idx ON project_migrations (project_id, created_at DESC)
    WHERE deleted_at IS NULL;
```

`projects` gains `realm_id text REFERENCES realms(id) ON DELETE RESTRICT` (nullable — a project can
outlive a soft-deleted realm row only through the migration path) + `projects_realm_idx`.

**The partial unique index IS the lock.** No advisory lock, no status column on `projects`.

Down block order: `project_migrations` before `projects`, `realms` after `projects`.

`00002_seed.sql`: one `realms` row for local development —
`('local', 'http://127.0.0.1:5100', region 'local', plan_id NULL, exclusive false)` with a token hash of
a documented dev token — so a fresh database can create a project without staff setup. The token itself
is `rlm_dev_local`, written in `.env.example` and `docs/local-development.md`; `RealmService.init()`
**refuses to boot** when a realm still carries that hash and `NODE_ENV=production`, so the convenience
cannot escape a laptop. `@appkit/realm-stub` reads the same value.

`TABLE_LABELS` in `contracts/retention.ts` gains `realms: 'Build realms'` and
`project_migrations: 'Project migrations'`; `RETENTION_DEFAULTS` gives `project_migrations` 90 days
and leaves `realms` at 0 (D10).

## Contracts

New `contracts/realms.ts`:

```ts
export const REALM_STATUSES = ['active', 'draining', 'offline'] as const
export const REALM_HEALTH = ['unknown', 'healthy', 'degraded', 'unhealthy'] as const
export const MIGRATION_STATES = ['exporting', 'importing', 'repointing', 'purging', 'completed', 'failed'] as const

export type Realm = {
    id: string; name: string; baseUrl: string; region: string
    planId: string | null; exclusive: boolean
    status: RealmStatus; health: RealmHealth
    diskFreeBytes: number; queueDepth: number
    projectCount: number
    lastSeenAt: string | null; createdAt: string
}
export type RealmDraft = { name: string; baseUrl: string; region?: string; planId?: string | null; exclusive?: boolean; status?: RealmStatus }
export type RealmToken = { realm: Realm; token: string }          // token shown once
export type ProjectMigration = { id: string; projectId: string; fromRealmId: string | null; toRealmId: string; state: MigrationState; error: string; startedAt: string; finishedAt: string | null }
export type ProjectLock = { locked: boolean; migration: ProjectMigration | null }
export type RealmHeartbeat = { health: RealmHealth; diskFreeBytes: number; queueDepth: number }
```

Barrel export in `contracts/index.ts`; `web/src/types/realms.ts` re-export + `types/index.ts`.

`contracts/signing.ts`: `SIGNING_KEYS` gains `'realm_upload'`, `'realm_transfer'` + labels.

`contracts/errors.ts` adds `realm_not_found`, `realm_name_exists`, `realm_in_use`, `realm_unavailable`,
`realm_offline`, `project_locked`, `migration_in_progress`.

`contracts/permissions.ts` adds `realm.read`, `realm.write`, `admin.project.read`, `admin.project.move`.
Seeded onto no role — staff hold them through the owner role or an explicit admin role; a derived
project that wants a moderator to move projects adds them to that `SEED_ROLES` entry plus the seed SQL.

`contracts/notifications.ts`: `NOTIFICATION_KINDS` gains `project_moved` (CHECK updated in lockstep).

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/realms` | `requirePermission('realm.read')` | — | — |
| POST | `/api/realms` | `requirePermission('realm.write')` | `realmSchema` | `realm_name_exists`, `invalid_body` |
| PATCH | `/api/realms/:id` | `requirePermission('realm.write')` | `{ ...realmSchema, required: [] }` | `realm_not_found`, `realm_name_exists` |
| DELETE | `/api/realms/:id` | `requirePermission('realm.write')` | — | `realm_not_found`, `realm_in_use` |
| POST | `/api/realms/:id/token` | `requirePermission('realm.write')` | — | `realm_not_found` |
| POST | `/api/admin/projects/:id/move` | `requirePermission('admin.project.move')` | `{ realmId }` | `project_not_found`, `realm_not_found`, `realm_offline`, `migration_in_progress` |
| GET | `/api/projects/:id/lock` | `requireProjectMember` | — | `project_not_found` |
| POST | `/api/realm/heartbeat` | realm bearer token | `RealmHeartbeat` | `unauthorized` |

`RealmService`

- `selectRealm(ownerId, trx)` — candidates: `deleted_at IS NULL AND NOT exclusive AND status = 'active'`
  and tier-compatible (`plan_id IS NULL OR plan_id = resolvePlan(ownerId).id`), **tier-matched preferred
  over general**, ordered by live project count then name. A realm whose `health` is `unhealthy`, or
  which has been silent for more than 90 s, is excluded — `status = 'active'` alone would keep handing
  projects to a machine that stopped answering. Returns `undefined` → the caller throws
  `UnavailableError('realm_unavailable')` → 503, rolling the creation transaction back.
- `moveProject(projectId, toRealmId, actor)` — one transaction: insert the `project_migrations` row
  (the unique-violation sentinel `'migration_in_progress'` is a `Result` err, mapped to 409), sign the
  `project.transfer` JWT with `realm_transfer`, enqueue the `realm.migrate` job. **Do not repoint
  `projects.realm_id` here** — the job does it at the `repointing` step.
- `heartbeat(realmId, payload)` — updates health/disk/queue and `last_seen_at`. The interval is **30 s**
  and the silence threshold **90 s** (3 × interval); a realm past it is rendered `unknown` in the
  registry (computed, never stored) and drops out of `selectRealm`.
- `rotateToken(realmId)` — the new token is live and the old one is dead **immediately**, no overlap
  window. An in-flight finalize on the old token fails, the realm retries, and anything that never
  lands is cleaned up by the orphan reaper (spec 02); an overlap window would mean two valid
  credentials for a machine whose token was rotated *because* it leaked.

`registerJobHandler('realm.migrate', …)` drives the strict order
`exporting → importing → repointing → purging → completed`, calling the two realms over HTTP with the
signed instruction, and **never purges the source until the target has confirmed presence, size and
sha256 of every file**. Failure sets `state = 'failed'` with the error, which releases the lock.
Non-terminal rows are re-enqueued at boot (`RealmService.init()`, wired in `index.ts` boot order like
`MaintenanceService`).

**Every step is idempotent and re-verifies before advancing**, because a crash replays the migration
from `exporting`: a second export against a realm that already exported returns the same manifest,
`importing` is a no-op for files already present with a matching sha256, and `repointing` re-checks the
target's manifest immediately before it writes `projects.realm_id`. `purging` only ever runs on a
confirmation taken after the repoint, never on one cached from an earlier attempt.

**A migration cannot hold the lock forever.** `registerJobHandler('realms.reap_stale_migrations', …,
{ cron: '*/5 * * * *' })` fails any migration that has sat in a non-terminal state for more than
30 minutes, with `error = 'migration timeout'` — which releases the lock and returns the project to
its users on the realm it is actually pointing at. `purging` is exempt: bytes may legitimately take
longer, and the project is already repointed and unlocked by then.

`registerJobHandler('realm.purge', …)` is the byte reaper (D7). Payload `{ realmId, paths: string[] }`,
signed with `realm_transfer` and POSTed to the realm's `/purge`; the job retries with the queue's
backoff and is idempotent by construction (deleting an absent path succeeds). Specs 01, 02 and 04
enqueue it on project delete, asset delete and build purge respectively. It is the only thing in the
platform that destroys data on a realm, and it never runs against a realm mid-migration.

Repository verbs: `RealmRepository` extends `BaseRepository` (`findAll`, `findById`, `findByName`,
`create` → `Result<RealmRow, 'exists'>`, `update`, `softDelete`, `countProjects`, `touchHeartbeat`);
`ProjectMigrationRepository` (`findActive(projectId)`, `create` → `Result<Row, 'in_progress'>`,
`advance(id, state)`, `fail(id, error)`, `findNonTerminal()`). Both conflict literals re-exported from
`conflicts.ts`.

Side effects: `recordAudit(actor, 'project.moved', projectId)` on move;
`notify(project.ownerId, 'project_moved', …)` when the migration completes. Realm CRUD is audited
(`realm.created` / `realm.updated` / `realm.deleted` / `realm.token_rotated`). All fire-and-forget.
The job-driven transitions (`project.move_completed`, `project.move_failed`, `realm.purged`) have no
user actor and pass `null`, recorded as the synthetic `system` actor (D8).

**A project whose realm is gone or offline stays readable.** `projects.realm_id` is nullable and a
realm can go `offline` under a live project, so every read path works unchanged while upload, build and
migration-target routes refuse with `realm_unavailable`, and the project surfaces a staff-visible
banner naming the realm. The console never pretends a project is broken because a machine is down.

**Plan changes do not move projects.** When a subscription change makes the current realm
tier-incompatible, the project is **flagged for staff** in `/admin/projects` — never auto-migrated. An
automatic migration would lock a project the user did not ask to lock, potentially mid-build, as a side
effect of a billing event; the flag is revisited when exclusive realms have real customers.

The realm bearer token is verified by a `preHandler` in `projectAuth.ts`'s sibling
`api/src/realmAuth.ts`: `Authorization: Bearer rlm_…`, hashed and compared against `realms.token_hash`,
decorating `request.realm`. These routes are exempt from the CSRF origin guard (no cookie is involved)
— add the `/api/realm` and `/api/internal` prefixes to the guard's skip list in `http.ts` — and they
are exempt from the project lock and the archive flag (D3): a realm finishing a write the platform
already authorised must not be refused, or the bytes strand.

## Web

- `state/realms.slice.ts` — `realms`, `realmsLoaded`, `fetchRealms`, `createRealm` (returns the
  once-shown token), `updateRealm`, `deleteRealm`, `rotateRealmToken`, `moveProject`.
- `state/projects.slice.ts` gains `lock: ProjectLock | null`, `pollLock(projectId)`,
  `stopLockPoll()`. The poll runs at 5 s while a lock exists, clears itself when the migration
  finishes, and **is dropped immediately on project switch** (spec 01) so a stale banner never hangs
  over the new project. Every mutating action short-circuits locally with a toast when `lock.locked`
  rather than letting the request 423.
- Pages: `pages/RealmsAdminPage.tsx` (`AuthGuard secured permission="realm.read"`),
  module `modules/RealmsAdmin.tsx`. The move action lives in the existing admin project directory
  module.
- Modals: `MODAL.REALM_EDITOR`, `MODAL.MOVE_PROJECT`, `MODAL.REALM_TOKEN` (shown once, copy button).
- `configs/strings.ts` — `realms` section incl. the exact banner copy: *"This project is being moved
  between realms. It is temporarily locked and read-only — changes are disabled until the move
  completes."*
- Nav: `strings.nav.realms` + a `SidebarMenu.tsx` entry under the platform group, gated on `realm.read`.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Locked banner | `tc-banner` | `specs/tc-banner.md` | `variant="warning"`, `icon`; **no `dismissible`** — it must clear itself |
| Registry header + Add | `tc-action-header` | `specs/tc-action-header.md` | `actions` JS prop; the `add` entry is dropped without `realm.write`, never disabled |
| Realm rows | `tc-action-row-list` | `specs/tc-action-row-list.md` | `tc-action-click`; swapped for `tc-data-list` for a read-only viewer |
| Exclusive / status marks | `tc-badge-row` | `specs/tc-badge-row.md` | `badges` JS prop — key/value chips, never colour alone |
| Realm editor | `tc-modal` + `tc-form-input` + `tc-extended-select` + `tc-select` + `tc-switch` | `specs/tc-modal.md`, `specs/tc-form-input.md`, `specs/tc-extended-select.md`, `specs/tc-select.md`, `specs/tc-switch.md` | Tier select defaults to *Any plan*; the exclusive switch's helper states that exclusive realms only receive projects by explicit move |
| Delete refused | `tc-alert` | `specs/tc-alert.md` | `variant="danger"`, names the hosted project count |
| Health | `tc-status-card` | `specs/tc-status-card.md` | One indicator row per realm — colour plus inline icon |
| Capacity figures | `tc-metric-grid` + `tc-metric-tile` | `specs/tc-metric-grid.md`, `specs/tc-metric-tile.md` | Disk free, queue depth, in-flight builds |
| Move action | `tc-action-items` | `specs/tc-action-items.md` | Kebab on the admin project row |
| Target picker | `tc-modal` + `tc-card-options` | `specs/tc-card-options.md` | `options` JS prop: one card per realm with tier + project count; exclusive included and marked; **offline realms omitted** |
| Move confirmation | `tc-alert` | `specs/tc-alert.md` | `variant="warning"` — states the project is locked until the transfer completes |
| Token shown once | `tc-code-snippet` | `specs/tc-code-snippet.md` | Ships its own copy button |

No new React component.

## Access policy

| Action | Permission |
| --- | --- |
| View the registry, health, capacity | `realm.read` |
| Create/edit/delete a realm, rotate its token | `realm.write` |
| See the admin project directory | `admin.project.read` |
| Move a project between realms | `admin.project.move` |
| See the locked banner / read a locked project | project membership |

Realm deletion is refused (`realm_in_use`) while any live project points at it — bytes physically live
there. No quota applies to realms.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: two tables + `projects.realm_id` + Down entries),
`sql/00002_seed.sql` (E: local realm row).

**api** — `contracts/realms.ts` (C) + `contracts/index.ts` (E), `contracts/signing.ts` (E),
`contracts/errors.ts` (E), `contracts/permissions.ts` (E), `contracts/notifications.ts` (E),
`schema/realms.ts` (C), `repositories/realms/sql/*.sql` (C: select/insert/update/delete/count-projects/
heartbeat, migration verbs), `repositories/realms/RealmRepository.ts` (C),
`repositories/realms/ProjectMigrationRepository.ts` (C), `conflicts.ts` (E: `'exists' | 'in_progress'`),
`services/RealmService.ts` (C), `domain/jobs.ts` (E: `realm.migrate` kind),
`realmAuth.ts` (C), `projectAuth.ts` (E: the 423 lock check reads `ProjectMigrationRepository`),
`routers/realmRouter.ts` (C), `routers/projectRouter.ts` (E: `/lock`),
`contracts/retention.ts` (E: two `TABLE_LABELS` entries + the `project_migrations` default),
`container.ts` (E), `http.ts` (E: `ROUTE_PLUGINS` + CSRF skip prefixes).

**realm-stub** — `realm-stub/package.json` (C), `realm-stub/src/index.ts` (C: upload receiver, JWT
verification against the published `realm_upload` key, finalize callback, build long-poll, canned
result, `/purge`), root `package.json` (E: workspace + `dev` script).

**web** — `types/realms.ts` (C) + `types/index.ts` (E), `services/RealmService.ts` (C),
`state/realms.slice.ts` (C) + `state/index.ts` (E: intersection + spread),
`state/projects.slice.ts` (E: lock poll), `configs/strings.ts` (E),
`modals/keys.ts` (E), `modals/RealmEditorModal.tsx` (C), `modals/MoveProjectModal.tsx` (C),
`modals/RealmTokenModal.tsx` (C), `modals/index.tsx` (E),
`modules/RealmsAdmin.tsx` (C), `modules/ProjectLockBanner.tsx` (C),
`modules/ProjectsAdmin.tsx` (E: move action), `modules/SidebarMenu.tsx` (E),
`pages/RealmsAdminPage.tsx` (C), `Router.tsx` (E),
`styles/modules/_realms.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/realms-and-migrations.md` (C) + `docs/index.md` (E),
`docs/signing-keys.md` (E: the two new keys), `docs/platform-hardening.md` (E: the realm auth prefixes).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. `curl -s localhost:6000/api/realms -b cookie | jq '.data'` → the seeded `local` realm.
3. Create a project (spec 01) → `realm_id` set. Set the only realm to `offline`, create another →
   `503` `realm_unavailable`, and **no** project row is written.
4. `POST /api/admin/projects/:id/move` → 202; immediately `PATCH` anything on that project → `423`
   `project_locked`; `GET` still 200. A second move attempt → `409` `migration_in_progress`.
5. Browser: the banner appears within one 5 s poll, mutating controls short-circuit with a toast, and
   the banner disappears by itself when the job reaches `completed`. Switch projects mid-lock — the
   banner must not follow.
6. Kill the API mid-migration and restart: the non-terminal row is re-enqueued and replays from
   `exporting`, and the replay is a no-op on the files the target already holds.
7. Stop the stub realm mid-migration and wait (or shorten the interval): after 30 minutes the sweep
   fails the migration, the lock clears and the project is usable again on its original realm.
8. Rotate a realm token while the stub holds the old one → its next finalize gets 401, it re-reads the
   token and succeeds.
9. Delete a project (spec 01) with the stub running → a `realm.purge` job runs and the stub reports the
   paths gone.

`admin.project.read` is a new screen at `/admin/projects` — the users admin is about accounts, and a
projects directory needs its own filters (realm, plan, tier mismatch, lock state).
