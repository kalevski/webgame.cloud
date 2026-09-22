# Realms and the project lock

A **realm** is a build machine outside this application: it receives uploaded bytes, processes them and
runs builds. The platform registers realms, assigns one to each project, and moves projects between them
under a lock.

## Registry

`realms` rows are staff-created (`realm.read` / `realm.write`, screen at `/platform/realms` — the nav entry sits
in the **Platform** section alongside the other staff screens; `/admin/realms` redirects there). Each carries a
`base_url`, an optional `region_id`, an optional `plan_id` tier, an `exclusive` flag, a `status`
(`active`/`draining`/`offline`), live `health`, `disk_free_bytes`, `queue_depth`, `cpu_usage`,
`memory_used_bytes`, `memory_total_bytes` and `last_seen_at`.

Heartbeat: `POST /api/realm/heartbeat` every **30 s**, carrying health, disk free, queue depth, CPU
percentage and memory usage; silence beyond **90 s** renders the realm `unknown` (computed, never stored)
and drops it out of selection. Every heartbeat also appends a `realm_samples` row — the time series behind
the detail-page statistics — and `realms.prune_samples` soft-deletes samples older than
`REALM_SAMPLE_RETENTION_DAYS` (7 days) nightly.

`selectRealm(ownerId)` picks from realms that are live, not exclusive, `active`, not `unhealthy`, not
silent, and tier-compatible — tier-matched preferred over general, then least-loaded by project count. No
candidate → `503 realm_unavailable`, and no project row is written.

Deleting a realm is refused (`realm_in_use`) while any live project points at it.

## Regions

A **region** is a label a realm can sit in — `realm_regions` rows carrying nothing but a `name` (unique per
live row, case-insensitively) and an `active` flag. They exist to be **defined before** any realm is
registered: `realms.region_id` is a nullable FK into the table, so registering a realm picks a region from
the list instead of typing free text, and a rename lands on every realm at once. Nothing seeds a region.

`GET /api/realm-regions` reads them (`realm.read`); `POST`, `PATCH /:id` and `DELETE /:id` write
(`realm.write`), all served by `realmRouter` off `RealmService.listRegions`/`createRegion`/`updateRegion`/
`removeRegion` over `RealmRegionRepository`. A duplicate name is `409 realm_region_name_exists`; an unknown
`regionId` on a realm write is `404 realm_region_not_found`; deleting a region that still has realms in it
is `409 realm_region_in_use` (the count travels as an error param). `active` is what gates the picker, not
what enforces anything: an inactive region keeps the realms already in it and simply stops being offered.

The screen is `/platform/realms` with a page-tab pair — **Realms** (`/platform/realms`) and **Regions**
(`/platform/realms/regions`, a static route declared before `/:id` so the id pattern cannot swallow it).
Tabs show on the list views only; a realm detail page replaces them. The page header's `actions` slot
follows the active tab: *Add realm*, *Add region*, or *Edit realm* on a detail view.

`RealmRegionsAdmin` renders a region as a **card in the same two-column grid the Realms tab uses**, so the
two tabs read as siblings rather than a grid next to a list. A card carries, in order: the region name set
in **uppercase mono** (region names are slugs — `eu-central`, `local` — so the machine-identifier treatment
is truthful, not decorative), the active/inactive badge, one sentence saying what the state actually does
(*Offered when a new realm is registered* / *Not offered for new realms. The ones already here keep
running*), and below a hairline rule the region's **occupancy**: the realm count as a mono legend, then the
realms themselves as chips.

The chips are the point of the screen. A region's whole meaning is which build machines sit in it, and
`realmCount` alone never answered that — so the module fetches the realms list alongside the regions,
groups it by `regionId`, and renders one chip per realm with a health-coloured dot (teal healthy, coral
degraded, red unhealthy, grey unknown) that links into `/platform/realms/:id`. A region with
`realmCount === 0` says so instead.

State is carried by the card's **material**, not by a second indicator: a closed region gets a dashed
border, a tinted surface and a muted name, matching the dashed edge `.console-empty` already uses for
"nothing in play here".

With `realm.write` the card ends in three controls: activate/deactivate (labelled by what the click *does*
— *Activate* / *Deactivate* — not by the state it is in, which is what the badge is for), *Edit* into
`RealmRegionModal`, and a delete that renders `disabled` with `regionDeleteBlocked(count)` as its tooltip
while realms sit in the region — the same pre-empt-the-409 treatment the realm delete gets.

**The status badge takes its label through `text`, not as a child**, and this is load-bearing rather than
stylistic — see *A `tc-badge` label that changes must ride on the `text` attribute* in
frontend-architecture.md. Toggling a region flips the badge's variant *and* its label in the same commit,
which is exactly the case that destroyed the badge's own markup.

## The list

The screen opens with a `tc-rich-page-header` (*Realms*, `Server`/cyan). Below the tabs sits a two-column
card grid (one column below `md`) directly on the page — no wrapping card. Each realm card shows a health
`tc-status-dot` (healthy/degraded/unhealthy/unknown mapped to online/away/busy/offline), the status badge,
an *Exclusive* badge when set, the base URL, region name and plan tier (plan names resolve through the
billing slice, fetched on mount), then **three `tc-progress` bars** — storage (assets hosted vs
hosted + heartbeat free), memory peak over 24 h (vs `memory_total_bytes`) and CPU peak over 24 h — each
labelled with its own figures and coloured by the same thresholds as the detail rings (≥60 % warning,
≥85 % danger). A stat block follows: health, project count, disk free, queue depth, last seen. Each card is
one big link into the realm's detail page — the list carries no per-realm actions; management lives on the
detail page.

The bar figures ride along on the list payload rather than costing a request per card: `select-realms.sql`
(and `select-realm.sql`) join `realm_regions` for `region_name` and add subqueries for `storage_used_bytes`
plus `peak_cpu_usage`/`peak_memory_used_bytes` over `REALM_SAMPLE_WINDOW_HOURS` of `realm_samples`. Those
are the `Realm` contract's `storageUsedBytes`, `peakCpuUsage` and `peakMemoryUsedBytes`; queries that do not
compute them (`select-realm-by-token.sql`, `select-candidate-realms.sql`) leave the optional row fields
absent and `toRealm` coalesces them to 0.

**Realm detail** lives at `/platform/realms/:id` — `:id` is the generated `realms.id` (a UUID minted by
`RealmRepository.create`), never the realm name (`RealmDetail`, same `realm.read` guard; the module
re-fetches every 30 s). It renders as bordered `tc-panel` sections and carries no actions of its own: *Edit
realm* is in the page header above it (the page owns the modal and re-fetches the detail on save), and the
destructive pair sits at the bottom — see **Danger zone** below.
**Live resources** shows three `tc-circular-progress` rings — CPU (with 24 h avg/peak),
memory (used/total plus 24 h avg/peak) and disk (assets used vs heartbeat free) — colored by threshold
(≥60 % warning, ≥85 % danger).
**Throughput** is a `tc-metric-tile` row: files today, builds today, builds/day (7 d), peak queue (24 h).
**Activity — last 24 hours** plots three `tc-area-chart`s (CPU %, memory used, queue depth) from
`GET /api/realms/:id/samples`, which buckets `realm_samples` into `REALM_SAMPLE_BUCKET_MINUTES` (5-minute)
averages over `REALM_SAMPLE_WINDOW_HOURS` (24). `GET /api/realms/:id` returns the realm;
`GET /api/realms/:id/stats` returns `RealmStats`: storage used (ready assets hosted on the realm), disk
free, files processed today, builds today, average daily builds over 7 days, current and 24-hour-peak
queue depth, current/average/peak CPU and current/average memory. The final **Hosted projects** panel is a
`tc-advanced-table` (rendered only with `admin.project.read`) that reuses the admin projects listing with
`realmId` pinned — search, sortable columns, pagination, per-project member/asset/build/storage counts,
and a row action into `/platform/projects/:id`. Its table state lives in the realms slice
(`realmProjects*`), separate from the project directory's, so neither screen leaks filters into the other.

Its **rows and columns come from `helpers/platformTables.ts`**, the same builders the all-projects
directory and a user's Projects tab use — this panel passes the shared column list minus `realm` (you are
already on the realm's page). Do not hand-write project rows here; add the column to the helper instead.
See platform-directories.md.

Registration follows the token flow, entirely inside one modal (`RealmEditorModal`, `size="lg"` and
scrollable, titled *Register realm* or *Edit realm* off its input): the operator starts the realm process
first (it waits for its token), registers it here with the URL it listens on — nothing has to answer at
that URL yet, the API never probes it at registration — and the modal then swaps to a one-time token reveal
(`tc-code-snippet` plus a copy button) instead of handing off to a second modal. The token is handed to the
realm process, which authenticates every heartbeat and build report with it. The operator never chooses an
id: `RealmRepository.create` mints a `randomUUID()` primary key, and the name is only a label (unique per
live row, case-insensitively) that a rename can change freely.

Its layout: on the create path a two-step `tc-stepper` (*Register* → *Token*, descriptions from
`flowStep*`) sits above an info `tc-alert` carrying `flowIntro`, and the reveal step re-renders the same
stepper on *Token* so the operator can see the flow is finished. Fields are grouped into two bordered
`.modal-realm-editor__group` sections — **Identity** (`Server` icon: name + region side by side, base URL
full width) and **Routing** (`Route` icon: plan tier + status side by side, each with a `tc-helper-text`,
then the *Exclusive* switch). The two-column rows collapse to one below `$bp-sm`. Edit mode renders the same
two sections without the stepper or the intro alert, since no token is issued.

Region and plan tier are both `tc-extended-select`s over an "unset" option plus the real choices, and both
use a **non-empty sentinel key** — `none` for region, `any` for plan tier — mapped back to `null` in the
draft. `tc-extended-select`'s `value` setter removes the attribute for a falsy value, so an item keyed `''`
can never read as selected: picking *Any plan* looked like it did nothing and the field stayed on its
placeholder. The region list offers active regions only, plus the realm's current region when editing one
whose region has since been deactivated, so an edit cannot silently drop it; with no active regions the
helper text points at the Regions tab instead.

**Danger zone.** The last panel on the detail page (`realm.write` only) is a `tc-danger-zone-actions` with
*Rotate token* and *Delete realm*. *Rotate token* opens `RealmTokenModal` as a confirm step (the old token
dies the moment the new one is shown) and reveals the replacement in place. *Delete realm* renders
`disabled` with `deleteBlocked(count)` as its description while the realm still hosts projects, so the
API's `realm_in_use` refusal is visible before the click rather than after it; otherwise it confirms
through `ConfirmDeleteRealmModal` and navigates back to the list.

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

**No realm is seeded.** `00002_seed.sql` deliberately inserts none, so a fresh database has zero realms and
project creation answers `503 realm_unavailable` until one is registered. Register the dev realm by hand at
`/platform/realms` → *Add realm* with base URL `http://127.0.0.1:5100`, copy the one-time token out of the
reveal step, put it in the repo-root `.env` as `REALM_DEV_TOKEN=…` and restart `npm run dev:realm`. A
rotate needs the same two steps again — the stub reads the token once at boot.

The dev-only `@webgame-cloud/realm-stub` workspace answers that protocol — it verifies upload tokens, writes bytes to
a temp directory, calls finalize, long-polls for builds, heartbeats with canned CPU/memory/queue figures
(so the realm detail statistics have data locally) and returns a canned build result. `npm run dev` starts
it beside the API and web.

**The stub answers CORS preflight, and it has to.** The browser `PUT`s asset bytes from `localhost:6001`
straight to the realm at `127.0.0.1:5100` with an `Authorization` header — a cross-origin request with a
non-simple header, so Chrome sends an `OPTIONS` preflight first. Without a reply the upload never leaves the
browser and the console reports every file as rejected while the API log shows a clean `201` for the ticket.
`send()` therefore stamps `access-control-allow-origin/methods/headers` on every response and the router
answers `OPTIONS` with `204`. A real realm needs the same headers for whatever origins its console is served
from.
