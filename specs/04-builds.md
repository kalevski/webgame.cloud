# Builds — packaging a bundle for delivery

> Source: `proposal/04-builds.md`. Shared decisions: [`README.md`](README.md).
> Depends on 03 (bundle resolution), 05 (realm claim protocol), 06 (config snapshot), 01 (`build.run`).

## Requirement

Triggering a build freezes a **snapshot** (the bundle's settings plus the resolved config versions) and
inserts a `pending` build pinned to the project's realm. The realm long-polls to claim it, posts
progress, and posts a result — the result endpoint being the **sole owner of terminal transitions**.
Statuses are renamed on the way out (`pending → queued`, `done → pass`, `failed → fail`). A build can
hold a **build tag** that is unique per bundle: setting it steals the tag from its sibling in one
transaction, which is how promotion and rollback work. Purge deletes every untagged build, so tagging
also protects. The screen groups builds by bundle, filters by status, and polls while anything is
`queued` or `running`.

## Scope

- `builds` + `build_files`; the trigger → claim → progress → result protocol.
- Build-tag exclusivity (one transaction) and purge-untagged.
- Builds screen (grouped, filtered, live-polling), build detail with state machine, outputs and the
  **How to integrate** drawer.
- Stale-build reaping for realms that claim and never report.

## Non-goals

- The asset pipeline itself (texture packing, normal-map compositing, audio spritesheets, deterministic
  ZIP, R2 publication) — that is the realm's implementation, described in the proposal for context.
  This spec owns the protocol and the rows.
- No build cancellation in v1 (a stuck build is reaped, not cancelled).
- No retry button — re-running a bundle produces a new build.

## Data model

```sql
CREATE TABLE builds (
    id             text PRIMARY KEY,
    project_id     text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    bundle_id      text NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    realm_id       text REFERENCES realms(id) ON DELETE SET NULL,
    triggered_by   text REFERENCES users(id) ON DELETE SET NULL,
    status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'done', 'failed')),
    build_tag      text NOT NULL DEFAULT '',
    snapshot       jsonb NOT NULL DEFAULT '{}'::jsonb,
    artifact_url   text NOT NULL DEFAULT '',
    manifest_url   text NOT NULL DEFAULT '',
    checksum       text NOT NULL DEFAULT '',
    size_bytes     bigint NOT NULL DEFAULT 0,
    duration_ms    integer NOT NULL DEFAULT 0,
    error          text NOT NULL DEFAULT '',
    claimed_at     timestamptz,
    finished_at    timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);
CREATE INDEX builds_bundle_idx ON builds (bundle_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX builds_claimable_idx ON builds (realm_id, created_at)
    WHERE status = 'pending' AND deleted_at IS NULL;
CREATE UNIQUE INDEX builds_tag_unique_idx ON builds (bundle_id, build_tag)
    WHERE build_tag <> '' AND deleted_at IS NULL;

CREATE TABLE build_files (
    id           text PRIMARY KEY,
    build_id     text NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    group_name   text NOT NULL DEFAULT 'textures'
                 CHECK (group_name IN ('textures', 'audio', 'text', 'configs', 'fonts', 'locales', 'dialogues')),
    name         text NOT NULL,
    url          text NOT NULL DEFAULT '',
    size_bytes   bigint NOT NULL DEFAULT 0,
    checksum     text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX build_files_build_idx ON build_files (build_id, group_name) WHERE deleted_at IS NULL;
CREATE INDEX builds_keyset_idx ON builds (project_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
```

`builds` is unbounded on an active project, so it takes `?cursor=` keyset paging on `(created_at, id)`
beside `offset` (D10, `repositories/pagination.ts`) — page numbers drift when a build lands mid-paging,
which on this screen happens constantly. `TABLE_LABELS` gains `builds: 'Builds'` and
`build_files: 'Build outputs'`, both at the `0` default: purge-untagged is the user-facing control, and
a silent retention sweep would delete a tagged release nobody asked it to touch.

`builds_tag_unique_idx` enforces "one build per tag per bundle" in the database; the tag-move
transaction clears the sibling first so the constraint is never hit in the happy path, and the `23505`
sentinel covers the race. `builds_claimable_idx` is the claim queue.

Statuses are stored raw and **renamed at the contract boundary** (`toBuild` mapper), not in SQL.

Down order: `build_files`, `builds`, then `bundles`.

## Contracts

`contracts/builds.ts`:

```ts
export const BUILD_STATUSES = ['queued', 'running', 'pass', 'fail'] as const     // wire vocabulary
export const BUILD_FILE_GROUPS = ['textures', 'audio', 'text', 'configs', 'fonts', 'locales', 'dialogues'] as const

export type Build = {
    id: string; projectId: string; bundleId: string; bundleName: string
    status: BuildStatus; buildTag: string
    artifactUrl: string; manifestUrl: string; checksum: string
    sizeBytes: number; durationMs: number; error: string
    triggeredBy: string; createdAt: string; finishedAt: string | null
}
export type BuildDetail = Build & { files: BuildFile[]; snapshot: BuildSnapshot }
export type BuildSnapshot = { bundle: Bundle; configs: Array<{ key: string; versionId: string; buildTag: string }> }
export type BuildFilters = { status?: BuildStatus; bundleId?: string; limit?: number; offset?: number; cursor?: string }

// realm-facing
export type RealmJob = { jobId: string; kind: 'asset_bundle:generate'; payload: { projectId: string; bundleId: string; uploadIds: string[]; relations: BundleResolution['relations']; options: BundleOptions } }
export type RealmJobStatus = { status: 'started' | 'in_progress'; progress?: number; message?: string }
export type RealmJobResult = { state: 'fulfilled' | 'rejected'; artifactUrl?: string; manifestUrl?: string; checksum?: string; sizeBytes?: number; durationMs?: number; files?: BuildFileDraft[]; error?: string }
```

`contracts/errors.ts` adds `build_not_found`, `build_not_finished`, `build_tag_unknown`,
`build_already_claimed`. The "this rule matches no files" refusal reuses **`bundle_empty`**, declared in
spec 03 — one code, raised at build time.

## API surface

Console-facing:

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/projects/:id/builds` | `requireProjectMember` | `BuildFilters` | `project_not_found` |
| GET | `/api/projects/:id/builds/:buildId` | `requireProjectMember` | — | `build_not_found` |
| POST | `/api/projects/:id/bundles/:bundleId/builds` | `requireProjectPermission('build.run')` | — | `bundle_not_found`, `bundle_empty`, `realm_unavailable`, `project_locked` |
| PUT | `/api/projects/:id/builds/:buildId/tag` | `requireProjectPermission('build.run')` | `{ buildTag: string }` | `build_not_found`, `build_tag_unknown`, `build_not_finished` |
| DELETE | `/api/projects/:id/builds/:buildId` | `requireProjectPermission('build.run')` | — | `build_not_found` |
| DELETE | `/api/projects/:id/builds` | `requireProjectPermission('build.run')` | — (purge untagged) | `project_not_found` |

Realm-facing (bearer token, `realmAuth`):

| Method | Path | Body | Notes |
|--------|------|------|------|
| POST | `/api/realm/jobs/next` | `{ waitMs?: number }` | Long-poll claim, ≤ 30 s |
| POST | `/api/realm/jobs/:jobId/status` | `RealmJobStatus` | Terminal values here are **ignored** |
| POST | `/api/realm/jobs/:jobId/result` | `RealmJobResult` | Sole owner of terminal transitions |

Public: `GET /api/public/projects/:id/assets` — the asset manifest of a build, resolved by `?buildId=`
or `?buildTag=`. Its content is `build_files`, so the **handler is this spec's**; the router it hangs
on, its cache headers and its rate limiting belong to spec 06's public surface.

`BuildService`

- `trigger(user, project, bundle)` — one transaction: `bundles.resolve(bundle)` → **empty upload list
  throws `ValidationError('bundle_empty')`** (a mistyped tag gets a refusal, not an empty artefact) →
  resolve the config versions for the bundle's build tag (spec 06) → write the `snapshot` jsonb →
  insert `status='pending'`, `realm_id = project.realm_id`.
- `claim(realm)` — `UPDATE builds SET status='running', claimed_at=now() WHERE id = (SELECT id FROM builds
  WHERE realm_id=$1 AND status='pending' AND deleted_at IS NULL AND project_id NOT IN (SELECT project_id
  FROM project_migrations WHERE state NOT IN ('completed','failed') AND deleted_at IS NULL) ORDER BY
  created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`, then assembles the `RealmJob` payload. No
  row → 204, the realm re-polls. A locked project's builds wait rather than run against bytes that are
  mid-transfer (D3); everything else on the realm keeps flowing.
- `report(realm, buildId, status)` — `started`/`in_progress` both collapse to `running`; anything else
  is dropped silently, by design.
- `complete(realm, buildId, result)` — `fulfilled → done`, `rejected → failed`; writes artefact URLs,
  checksum, size, duration, and **replaces** all `build_files` rows (soft-delete the old set, insert the
  new one, same statement) so a retry is idempotent. Rejects a realm that does not own the build. The
  replaced rows go to the purge worker on the normal retention schedule; CDN copies keyed by the old
  URLs are unaffected, because a cache is keyed by URL and the URLs do not change under it.
- `setTag(project, build, tag)` — validate against `project_build_tags`; one transaction clearing the
  tag from the sibling build of the same bundle and setting it here.
- `purgeUntagged(project)` — CTE soft-deleting every build with `build_tag = ''` plus their
  `build_files`, returning the count for the confirmation copy, then enqueuing `realm.purge` (D7) with
  the deleted artefacts' paths. Single delete does the same for one build.

**The trigger route accepts `Idempotency-Key`** (D12): a double-clicked *Build now* must not queue two
jobs on the realm.

**The long poll holds one Postgres listener for the whole process, not one per waiter.** A build
insert issues `NOTIFY builds_pending, '<realmId>'`; a single process-wide `LISTEN` connection (the same
pattern the access-policy invalidation already uses) fans the notification out to an in-memory registry
of waiting requests, each of which resolves immediately or times out at 30 s. A connection per poll
would exhaust the pool with a handful of realms.

`registerJobHandler('builds.reap_stale', …, { cron: '*/5 * * * *' })` fails builds `running` for longer
than the `build_timeout_minutes` platform setting (default **30**, editable in `/admin/settings`
because a thousand-sprite atlas is a legitimately slow build) with `error = 'realm timeout'` —
otherwise a crashed realm leaves a permanently spinning row on the user's screen.

**Artefact URLs are realm-absolute.** `artifact_url`, `manifest_url` and `build_files.url` are whatever
the realm reports, served by the realm (or whatever CDN it fronts itself with); the platform stores
strings and never proxies bytes. A project migration therefore rewrites them: the `repointing` step of
`realm.migrate` (spec 05) updates the stored URLs to the target realm in the same transaction that
moves `projects.realm_id`, so a tagged release keeps resolving across a move.

Side effects: audit `build.triggered`, `build.tagged`, `build.deleted`, `build.purged`;
`notify(project.ownerId, 'build_failed', …)` only on failure — success is visible on the screen the user
is already watching. Realm-driven results and the stale reaper audit with a `null` actor (D8).

## Web

- `state/builds.slice.ts` — `builds`, `buildsLoaded`, `filters`, `detail`, `polling`, `fetchBuilds`,
  `fetchBuild`, `runBuild(bundleId)`, `setBuildTag`, `deleteBuild`, `purgeBuilds`.
- **Both the list and the detail poll at 2500 ms** while any visible build is `queued`/`running`, and
  stop on their own once everything settles. The poll is owned by the module's effect, cleared on
  unmount and on project switch.
- One status vocabulary everywhere — **Queued / Running / Passed / Failed** — on chips, rows and the
  detail badge, always icon + label so colour is never the only signal.
- The Manage Build Tag modal reads the **project's own** build tags: each card is *Available* or
  *Currently on build `<hash>`*, and selecting a taken one shows *"Tag `release` will be moved from
  build `a3f9c1e` to this build."*
- Single delete is a plain confirmation; **Purge** is type-to-confirm and names how many untagged builds
  will go.
- The How-to-integrate drawer carries copy buttons for the Project ID and the build reference, labelled
  *"Build tag (preferred)"* over the build ID, plus the SDK snippet.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Status filter | `tc-chip-group` | `specs/tc-chip-group.md` | `items` JS prop (`{id,label,selected,count}`); `tc-toggle` → `{id}`. All / Passed / Failed / Running / Queued |
| Per-bundle grouping | `tc-group` | `specs/tc-group.md` | `label` + `badge` (build count); `action-label="Build now"` fires `tc-action-click` (needs `build.run`) |
| Build row | `tc-build` | `specs/tc-build.md` | `name`/`date`/`size`/`duration`/`status`/`badge` attributes; `menuItems` JS prop; `tc-click`, `tc-menu-select` → `{key}` |
| Purge / header | `tc-action-header` | `specs/tc-action-header.md` | `actions` JS prop; dropped without `build.run` |
| Build progress (detail) | `tc-state-machine` | `specs/tc-state-machine.md` | `states` JS prop — queued → running → pass/fail as `done`/`active`/`error` markers |
| Build metadata | `tc-badge-row` | `specs/tc-badge-row.md` | Hash, size, duration as key/value chips |
| Output files | `tc-group` + `tc-asset-row-list` | `specs/tc-group.md`, `specs/tc-asset-row-list.md` | One group per `BUILD_FILE_GROUPS` entry |
| Integrate panel | `tc-drawer` + `tc-code-snippet` | `specs/tc-drawer.md`, `specs/tc-code-snippet.md` | Drawer is controlled — set `open=false` on `tc-close`; the snippet ships its own copy button |
| Manage build tag | `tc-modal` + `tc-card-options` | `specs/tc-modal.md`, `specs/tc-card-options.md` | `options` from `project_build_tags`, each card *Available* / *Currently on build …* |
| Tag-move warning | `tc-alert` | `specs/tc-alert.md` | `variant="warning"`, names both builds |
| Purge confirmation | `tc-modal` + `tc-form-input` | `specs/tc-modal.md`, `specs/tc-form-input.md` | Type-to-confirm; body names the untagged count |

No new React component.

## Access policy

Read: any member. Trigger, tag, delete, purge: `build.run`. Claim/report/result: the project's own realm
via its bearer token — a realm may only claim builds whose `realm_id` matches it, and only report on
builds it claimed. No per-build quota; builds are bounded by purge and retention, not by plan.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `builds`, `build_files`, three indexes, Down entries).

**api** — `contracts/builds.ts` (C) + `contracts/index.ts` (E), `contracts/errors.ts` (E),
`contracts/notifications.ts` (E: `build_failed` + CHECK lockstep), `schema/builds.ts` (C),
`repositories/builds/sql/*.sql` (C: select-builds, select-build, insert-build, claim-build,
update-status, complete-build, replace-build-files, set-build-tag, clear-sibling-tag, delete-build,
purge-untagged, reap-stale), `repositories/builds/BuildRepository.ts` (C), `conflicts.ts` (E),
`services/BuildService.ts` (C), `routers/buildRouter.ts` (C), `routers/realmJobRouter.ts` (C),
`routers/publicGameRouter.ts` (E: the asset-manifest handler; the router itself is spec 06),
`contracts/retention.ts` (E: two labels), `domain/jobs.ts` (E: `builds.reap_stale`),
`container.ts` (E), `http.ts` (E).

**web** — `types/builds.ts` (C) + `types/index.ts` (E), `services/BuildService.ts` (C),
`state/builds.slice.ts` (C) + `state/index.ts` (E), `configs/strings.ts` (E),
`modals/keys.ts` (E), `modals/ManageBuildTagModal.tsx` (C), `modals/PurgeBuildsModal.tsx` (C),
`modals/index.tsx` (E), `modules/ProjectBuilds.tsx` (C), `modules/BuildDetail.tsx` (C),
`pages/ProjectBuildsPage.tsx` (C), `pages/BuildDetailPage.tsx` (C), `Router.tsx` (E),
`modules/SidebarMenu.tsx` (E), `styles/modules/_builds.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/builds.md` (C) + `docs/index.md` (E), `docs/realms-and-migrations.md` (E: the job
protocol), `docs/background-jobs.md` (E: the stale reaper).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. Trigger a build on a bundle whose rule matches nothing → `400 bundle_empty`, no row written.
3. Trigger a real one, then as the realm:
   `curl -s -X POST localhost:6000/api/realm/jobs/next -H 'authorization: Bearer rlm_…' | jq '.data'` →
   one job with `uploadIds` and `relations`; a second immediate claim → 204.
4. `POST …/status {"status":"done"}` → **ignored**, row stays `running` (this is the deliberate rule).
   `POST …/result {"state":"fulfilled",…}` → row `done`, files written. Repeat the result call → same
   final state, `build_files` replaced not duplicated.
5. Set tag `release` on build A, then on build B → A's tag is empty, B holds it, one row per
   `(bundle_id, build_tag)`.
6. Purge → tagged builds survive; the confirmation counted correctly.
7. Browser: list and detail both refresh every 2.5 s while running and stop by themselves; a read-only
   member sees no Build now, no kebab, no purge.
8. Trigger a build on a project that is mid-migration → the row is created but never claimed until the
   migration finishes; `GET` on the build list still works throughout.
9. Two `POST …/builds` with the same `Idempotency-Key` → one build row, one realm job.
10. Purge a build → `realm.purge` runs and the stub reports the artefact gone; a tagged build's
    artefact is untouched.
11. Page the build list with `?cursor=` while a build lands → no row is repeated or skipped.

Tagging requires a **passed** build (`build_not_finished`), so a failed build can never hold a tag —
the "does a failed build keep its tag" case cannot arise.
