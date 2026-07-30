# Realms and the project lock

A **realm** is a build machine outside this application: it receives uploaded bytes, processes them and
runs builds. The platform registers realms, assigns one to each project, and moves projects between them
under a lock.

## Registry

`realms` rows are staff-created (`realm.read` / `realm.write`, screen at `/platform/realms` — the nav entry sits
in the **Platform** section alongside the other staff screens; `/admin/realms` redirects there). Each carries a
`base_url`, an optional `plan_id` tier, an `exclusive` flag, a `status` (`active`/`draining`/`offline`),
live `health`, `disk_free_bytes`, `queue_depth` and `last_seen_at`.

Heartbeat: `POST /api/realm/heartbeat` every **30 s**; silence beyond **90 s** renders the realm `unknown`
(computed, never stored) and drops it out of selection.

`selectRealm(ownerId)` picks from realms that are live, not exclusive, `active`, not `unhealthy`, not
silent, and tier-compatible — tier-matched preferred over general, then least-loaded by project count. No
candidate → `503 realm_unavailable`, and no project row is written.

Deleting a realm is refused (`realm_in_use`) while any live project points at it.

The screen opens with a `tc-rich-page-header` (*Realms*, `Server`/cyan), then two cards: **Realms** — the
registry list, one row per realm with *Edit realm*, and *Add realm* in the card's `action` slot — and
**Realm maintenance**, a `tc-danger-zone-actions` panel carrying the per-realm *Rotate token* and *Delete
realm* rows with the consequence spelled out in each row's description. Delete is rendered disabled while
the realm still hosts projects, with `deleteBlocked(count)` as its description, so the API's `realm_in_use`
refusal is visible before the click rather than after it. The maintenance card renders only with
`realm.write`.

## Trust boundary

Two independent directions, never one key for both:

- **API → realm** is asymmetric-signed: `realm_upload` (upload tickets, 15 min) and `realm_transfer`
  (migration and purge instructions), both through the existing `SigningKeyService`.
- **Realm → API** is a per-realm bearer token (`realms.token_hash`, `rlm_…`), shown once at creation and
  on rotation. Rotation is immediate — there is no overlap window.

`/api/realm/*` and `/api/internal/*` authenticate with that token and nothing else: no session, no cookie,
no CSRF origin check, and they are exempt from the project lock and archive flag (a finalize completes a
write the platform already authorised).

## The project lock

`project_migrations` has a partial unique index on `project_id` for non-terminal states — **that index is
the lock**. While a row exists, every mutating console request on the project returns `423 project_locked`
and its builds are not claimable; reads and the public surface keep working.

`POST /api/admin/projects/:id/move` (`admin.project.move`) inserts the row and enqueues `realm.migrate`,
which drives `exporting → importing → repointing → purging → completed`. Every step is idempotent and
re-verifies before advancing; the source is never purged until the target confirms every file. Failure
sets `failed`, which releases the lock. Non-terminal rows are re-enqueued at boot, and
`realms.reap_stale_migrations` fails anything stuck for more than 30 minutes (except `purging`).

A plan change that makes the current realm tier-incompatible **flags for staff** — it never auto-migrates.

## Byte deletion

`realm.purge` (`{ realmId, paths[] }`) is the only path that destroys data on a realm. Project delete,
asset delete and build purge enqueue it; the job queue retries, and deleting an absent path succeeds.

## Local development

`00002_seed.sql` seeds a `local` realm at `http://127.0.0.1:5100` whose token is `rlm_dev_local`. The
dev-only `@webgame-cloud/realm-stub` workspace answers that protocol — it verifies upload tokens, writes bytes to
a temp directory, calls finalize, long-polls for builds and returns a canned result. `npm run dev` starts
it beside the API and web.

**The stub answers CORS preflight, and it has to.** The browser `PUT`s asset bytes from `localhost:6001`
straight to the realm at `127.0.0.1:5100` with an `Authorization` header — a cross-origin request with a
non-simple header, so Chrome sends an `OPTIONS` preflight first. Without a reply the upload never leaves the
browser and the console reports every file as rejected while the API log shows a clean `201` for the ticket.
`send()` therefore stamps `access-control-allow-origin/methods/headers` on every response and the router
answers `OPTIONS` with `204`. A real realm needs the same headers for whatever origins its console is served
from.
