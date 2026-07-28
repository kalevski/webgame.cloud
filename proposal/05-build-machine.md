# The build machine (the "realm")

> The worker that receives uploads and runs builds, and the project lock that guards it.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What it is to the user

Invisible. A developer never sees it. But every upload goes straight to it, and every build runs on
it, so when it is unhealthy the user feels it immediately.

A realm is a **server outside this application** that receives uploaded bytes, processes images, and
runs builds. The platform never does that work itself — it registers realms, decides which one hosts
a project, and hands them signed instructions.

## The realm registry

Realms are rows in a `realms` table, managed by staff:

| Column | Meaning |
| --- | --- |
| `name` | Unique, human-readable — `eu-west-1`, `studio-dedicated` |
| `base_url` | Where the realm answers |
| `region` | Free text, for operators |
| `plan_id` | Restricts the realm to one subscription tier. `NULL` accepts any plan |
| `exclusive` | Never auto-assigned — see below |
| `status` | `active` / `draining` / `offline` |
| `last_seen_at` | Set by heartbeat |

Every table carries `created_at`, `updated_at` and `deleted_at`; deletes are soft, and a realm cannot
be deleted while it still hosts projects — its bytes physically live there, so the projects have to be
moved off first.

Projects carry a nullable `realm_id`.

## Two rules decide where a project lands

**Tier.** A realm with `plan_id` set only accepts projects whose owner is on that plan — a Studio-only
box, a free-tier box. A realm with no `plan_id` accepts anything. Selection prefers a tier-matched
realm over a general one, so adding a realm for one plan does not disturb the rest.

**Exclusive.** An exclusive realm is **never chosen automatically**. It exists to be assigned by
hand — a dedicated machine for one customer, an isolated box for a heavy project, a staging realm. The
only way a project arrives on one is an admin or moderator moving it there.

## One project lives on exactly one realm

The realm is chosen when the project is created. Auto-selection considers realms that are all of: not
deleted, **not exclusive**, `status = 'active'`, and tier-compatible — then picks the least loaded by
live project count, tie-broken by name so the choice is stable.

If **no realm can host it, project creation fails with `503` and rolls back** rather than creating a
realm-less project that could never accept an upload.

## Moving a project by hand

An admin or moderator can move **any project from any realm to any other**, including onto an
exclusive realm — that is what exclusivity is for. The platform does not copy bytes between machines.
It **issues a signed instruction and repoints the project**, then the realms carry out the transfer
between themselves.

The instruction is a JWT signed with the **`REALM_TRANSFER`** key:

| Claim | Purpose |
| --- | --- |
| `action` | `project.transfer` — what the realm is being told to do |
| `projectId` | The project being moved |
| `ownerId` | The account whose data is moving |
| `fromRealmId` | Where the data lives now; `null` if the project was never assigned |
| `toRealmId` | The destination |
| `iss`, `iat`, `exp` | Issuer and a short lifetime |
| `kid` (header) | Which `REALM_TRANSFER` key version signed it |

The receiving realm verifies the signature against the published `REALM_TRANSFER` public key and then
moves **all of that owner's data** for the project across.

**`REALM_TRANSFER` is a separate key from `REALM_UPLOAD`, deliberately.** A machine that accepts
uploads should not, by holding one public key, be able to validate an instruction that relocates a
customer's entire dataset. Two keys means two independently rotatable trust relationships, and a
compromised upload key cannot be used to forge a data move.

Every move is audited — who moved what, from which realm to which — and the project is locked for the
duration.

## The project lock

Moving a project between realms (staff action, or automatically when a plan change makes the current
realm incompatible) creates a `project_migrations` row. A **partial unique index** —
`(project_id) where state not in ('completed','failed')` — means only one can exist at a time, so
**the row itself is the lock**.

While it exists:

- every mutating request on that project returns **`423`**,
- reads still work,
- a global banner sits above every project page: *"This project is being moved between realms. It is
  temporarily locked and read-only — changes are disabled until the move completes."*
- the client re-polls every 5 seconds, clears the banner by itself when the move finishes, and
  short-circuits every mutating action locally with a toast rather than letting it `423`.

The move is strictly ordered — `exporting → importing → repointing → purging → completed` — and
**the source realm is never purged until the target has validated the import** (presence, size and
sha256 of every file). A crash before the repoint leaves the project safely on the source realm. Non-terminal
migrations are re-enqueued at boot and replay from the export, so a restart cannot strand a project.

## The reliability machinery inside the worker

The worker carries heavy, slow work off the request path, so it has to survive crashing mid-job
without corrupting anything or losing a customer's work:

- **Offline token verification** — an upload arrives carrying a JWT signed with the platform's
  `REALM_UPLOAD` key. The worker verifies the signature against the published public key for the
  `kid` in the token header, then checks expiry, the declared size ceiling and the MIME type. It
  never calls the API to ask whether an upload is allowed, so a slow API cannot stall a transfer.
- **Replay protection** — every upload token id (`jti`) it has ever accepted is remembered, together
  with the original result. A replayed token returns `200` with that same result instead of writing
  twice.
- **Durable outbound reports** — every status/result report is written to local storage *before*
  sending, retried with backoff, and dead-lettered rather than lost.
- **A compression queue whose rows are never deleted** — it doubles as the asset-id → path lookup.
- **Stuck-row recovery and poison-pill quarantine** — a job that keeps failing is set aside, not
  retried forever.
- **A single-instance lock file** and a boot readiness gate that reports unhealthy until storage and
  connectivity checks pass.
- **Health degrades on low disk** — it reports `degraded` below 10 GiB free, before it fails.

---

## Screens & components

Surfaces: the **project-locked banner**, the **realm registry** and the **move-project** action, both under admin.

```
pages/FooPage.tsx      route shell — page title, auth guard, layout wrapper
  └ modules/Foo.tsx    the screen — selectors, actions, modals, tc-* elements
      └ state/foo.slice.ts   fetch/mutate, alerts
          └ services/FooService.ts   one method per endpoint
```

These four rules apply to every screen:

- **Gate reads and writes separately.** The page renders for any project member; each write control is
  wrapped in the matching permission check. A read-only member must never see a dead button — drop the
  entry from a `tc-action-header` `actions` array rather than disabling it, and swap an actionable
  `tc-action-row-list` for a plain `tc-data-list`.
- **Boolean props need `value || undefined`** so the attribute is absent when off.
- **Object props and custom events go through `useTc<HTMLElement>(props, events)`** — assign the
  returned ref. Anything set via a JS property (`options`, `items`, `steps`, `usage`, `tabs`, `states`,
  `badges`) is passed this way, not as an attribute.
- **`tc-advanced-table` body rows are a trusted HTML string** fed through `rows`, never React children —
  escape every interpolated value, and handle clicks with one delegated handler on the module root.

Read the matching component spec before using a `tc-*` element; attribute names and event payloads are
per component.

Developers never see the realm itself. Three surfaces exist — one for them, two for staff.

**For the developer — the project-locked banner:**

| Surface | Component | Notes |
| --- | --- | --- |
| Project-locked banner | `tc-banner` | Leading icon + body + optional action. **Do not enable dismissal** — it must clear itself when the move completes |

**For staff — the realm registry:**

| Region | Component | Notes |
| --- | --- | --- |
| Header + Add realm | `tc-action-header` | The add action renders only with the realm-write permission |
| Realm list | `tc-action-row-list` | One row per realm: name, base URL, tier, status, project count |
| Exclusive / status marks | `tc-badge-row` | `Exclusive` and the status as key/value chips, so neither is carried by colour alone |
| Realm editor | `tc-modal` | Name, base URL, region, tier (`tc-extended-select`, defaulting to *Any plan*), status (`tc-select`), and an exclusive toggle (`tc-switch`) whose helper says plainly that exclusive realms only receive projects by an explicit move |
| Delete refused | `tc-alert` | Naming how many projects still sit on the realm |
| Health | `tc-status-card` | One indicator row per realm — colour plus an inline icon |
| Capacity figures | `tc-metric-grid` + `tc-metric-tile` | Disk free, queue depth, in-flight builds |

**For staff — moving a project:**

| Region | Component | Notes |
| --- | --- | --- |
| Move action | `tc-action-items` | On the project row in the admin project directory |
| Target picker | `tc-modal` + `tc-card-options` | Every realm as a card — tier and project count on each, exclusive ones included and marked. Offline realms are not offered |
| Confirmation | `tc-alert` variant `warning` | States that the project is locked until the transfer completes |
