# Builds

Triggering a build freezes a **snapshot** (the bundle's settings plus the resolved config versions) and
inserts a `pending` build pinned to the project's realm.

## Protocol

| Step | Route | Notes |
| --- | --- | --- |
| Trigger | `POST /api/projects/:id/bundles/:bundleId/builds` | `build.run`; empty rule → `bundle_empty`; honours `Idempotency-Key` |
| Claim | `POST /api/realm/jobs/next` | Long-poll, ≤ 30 s, `FOR UPDATE SKIP LOCKED`; 204 when idle |
| Progress | `POST /api/realm/jobs/:jobId/status` | `started`/`in_progress` collapse to `running`; terminal values are **ignored** |
| Result | `POST /api/realm/jobs/:jobId/result` | The sole owner of terminal transitions |

Statuses are stored raw (`pending`/`running`/`done`/`failed`) and renamed at the contract boundary to
**queued / running / pass / fail**.

The long poll holds **one** in-memory waiter registry per process — a build insert wakes the waiters for
that realm. A connection per poll would exhaust the pool with a handful of realms.

A build on a locked project is not claimable: the claim query filters out projects with a non-terminal
migration.

## Build tags

`builds_tag_unique_idx` enforces one build per tag per bundle. Setting a tag clears it from the sibling in
the same transaction — that is how promotion and rollback work. Tagging requires a **passed** build
(`build_not_finished`), so a failed build can never hold a tag. Purge deletes every untagged build, so
tagging also protects.

## Artefacts

`artifact_url`, `manifest_url` and `build_files.url` are whatever the realm reports — the platform stores
strings and never proxies bytes. A project migration rewrites them at the `repointing` step so a tagged
release keeps resolving across a move.

`builds.reap_stale` fails builds `running` longer than the `build_timeout_minutes` setting (default 30),
so a crashed realm cannot leave a permanently spinning row.

Failure notifies the project owner (`build_failed`); success does not — it is visible on the screen the
user is already watching.


## Snapshot contents

`BuildSnapshot` now also stores `assets` — the asset list (`id`, `name`, `kind`, `sizeBytes`, `tags`) that
matched the bundle rule at trigger time, filled from `BundleService.preview`. It is optional, so builds
created before the change simply have none. See live-builds.md for the screen that reads it.
