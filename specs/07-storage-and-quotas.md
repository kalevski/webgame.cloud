# Storage, quotas and plans

> Source: `proposal/07-storage-and-quotas.md`. Shared decisions: [`README.md`](README.md).
> **Build this first** — every other spec calls into the plumbing it lands.

## Requirement

Quotas become two-scoped and byte-aware. Account-scoped resources (`projects`, `storage_mb`) count per
user; project-scoped resources (`bundles_per_project`, `configs_per_project`, `members_per_project`)
count per project and resolve their ceiling from the **project owner's** plan. Storage is metered in
bytes, checked against the *incoming batch* rather than the current total, and has a grace zone: at or
above the cap the overage is flagged, at or above `cap × 1.5` the write is blocked. Staff can hand any
user any plan through `subscriptions.staff_override_plan_id`, and that override wins everywhere.

"Owner" here means `projects.owner_id` (the per-resource owner), not `OWNER_ROLE_ID`.

## Scope

- `LIMITABLE_RESOURCES` partitioned into `ACCOUNT_LIMITED` / `PROJECT_LIMITED`; five resources total,
  with the usage types narrowed to the account-scoped half (D4).
- `AccessPolicyRepository.PROJECT_COUNT_SQL` + one `count-*.sql` per project-scoped resource.
- `AccessPolicyService.assertWithinProjectLimit(project, resource)` and
  `assertStorageHeadroom(ownerId, addBytes)` with the three-tier verdict.
- `INTERNAL_SOFT_CAPS` applied when a plan limit is `null`.
- `subscriptions.staff_override_plan_id` + `storage_overage_bytes` + `storage_overage_flagged_at`.
- Seeded `indie` / `indie_plus` / `studio` plans, their roles, and their `role_limits` rows.
- Usage endpoint extended with project-scoped usage; the navbar usage popover and the plan-limit modal.

## Non-goals

- No payment gateway. Managed plans keep saying upgrades are unavailable until a port is registered.
- No metered billing for the grace zone — overage is flagged, never charged. The Studio storage add-on
  is bought explicitly and is a plan row, not a meter.
- No usage counters table. Usage is computed live (`sum(size_bytes)`, `count(*)`), per the proposal.

## Data model

`00001_schema.sql`, in the billing group:

```sql
ALTER-in-place on subscriptions (edit the CREATE TABLE):
    staff_override_plan_id   text REFERENCES billing_plans(id) ON DELETE SET NULL,
    storage_overage_bytes    bigint NOT NULL DEFAULT 0,
    storage_overage_flagged_at timestamptz,
```

`billing_plans` gains `storage_overage_allowed boolean NOT NULL DEFAULT false`.

No new tables. `role_limits` already carries `(role, resource, max_count)` with `NULL = unlimited` —
the five resources are seed rows against it.

`00002_seed.sql` — three plan roles + three plans + their limits (mirroring `SEED_ROLES`):

| Role | `projects` | `storage_mb` | `bundles_per_project` | `configs_per_project` | `members_per_project` |
| --- | --- | --- | --- | --- | --- |
| `indie` | 1 | 100 | 1 | 2 | 1 |
| `indie_plus` | 3 | 1024 | 3 | 10 | 3 |
| `studio` | NULL | 10240 | NULL | NULL | NULL |

Plus `billing_plans` rows (`indie` free, `indie_plus` 699, `studio` 4999, all `mode='manual'` until a
port exists; `studio.storage_overage_allowed = true`) and `settings` slot bindings
(`role_slot_default = 'indie'`, one `role_slot_plan_*` per paid plan) mirroring `SEED_ROLE_BINDINGS`.
The seed also switches the `billing` product flag **on** (D8) — `FEATURE_FLAG_DEFAULTS` ships it off,
and with it off no plan ceiling resolves.

`members_per_project` counts the owner, because the owner holds a `project_members` row (spec 01).
`indie`'s ceiling of 1 therefore means "no teammates", and the members screen says so in those words
rather than rendering an empty roster behind a dead Invite button. `storage_mb` counts only `ready`
assets: an in-flight batch is not yet billed, so a large drop can transiently exceed the cap and is
reconciled the moment each file finalises — the orphan reaper (spec 02) closes the window on files that
never land. The grace zone is **storage-only**; `projects`, `bundles`, `configs` and `members` are hard
ceilings with no overage tier.

Rebuild after editing: `dropdb starter && npm run migrate`.

## Contracts

`contracts/limits.ts`:

```ts
export const ACCOUNT_LIMITED = ['projects', 'storage_mb'] as const
export const PROJECT_LIMITED = ['bundles_per_project', 'configs_per_project', 'members_per_project'] as const
export const LIMITABLE_RESOURCES = [...ACCOUNT_LIMITED, ...PROJECT_LIMITED] as const

export type AccountLimitedResource = typeof ACCOUNT_LIMITED[number]
export type ProjectLimitedResource = typeof PROJECT_LIMITED[number]

export type StorageVerdict = 'ok' | 'grace' | 'blocked'

export type StorageStatus = {
    usedBytes: number
    limitBytes: number | null
    graceBytes: number | null
    verdict: StorageVerdict
    overageAllowed: boolean
}

export type ProjectLimitUsage = LimitUsage & { projectId: string }
```

`RESOURCE_LABELS` gains the five labels (`Storage`, `Bundles per project`, …) — `tasks` goes.

**Ceilings keep the full union; usage narrows.** `LimitMap`, `role_limits`, `user_limit_overrides` and
both admin editors stay `Partial<Record<LimitableResource, …>>` — all five are per-plan numbers and
staff may override any of them for one account. But `ResolvedLimits`, `LimitUsage.resource`,
`AccessPolicyRepository.countAll(userId)` and `UserAccessPayload.usage` become
`AccountLimitedResource`-typed: there is no per-user count of a project-scoped resource, and typing it
as though there were is what would let a caller ask for one. Project usage rides on the project
payload and on `GET /api/projects/:id/usage`.

**Units.** `role_limits.max_count` is an integer, so `storage_mb` is stored in **megabytes** (readable
in `psql`, consistent with the other four counts). Bytes exist only on the wire and in the checks:
`AccessPolicyService` converts once (`limitBytes = maxCount * 1_048_576`), `StorageStatus` is bytes
throughout, and `INTERNAL_SOFT_CAPS.storage_mb = 1_048_576` is megabytes like its neighbours (1 TB).
No other layer multiplies or divides.

`contracts/errors.ts` adds `storage_limit_reached`, `storage_hard_cap_exceeded`,
`project_limit_reached`. `limit_reached` stays for account-scoped counts.

`contracts/billing.ts`: `Plan` gains `storageOverageAllowed: boolean`; `Subscription` gains
`staffOverridePlanId: string | null`, `storageOverageBytes: number`, `storageOverageFlaggedAt: string | null`.

`domain/access.ts`:

```ts
export const INTERNAL_SOFT_CAPS: Record<LimitableResource, number> = {
    projects: 100, storage_mb: 1_048_576,
    bundles_per_project: 1_000, configs_per_project: 10_000, members_per_project: 500,
}
```

Applied only where the resolved limit is `null`, and never surfaced in any payload.

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/account/usage` | `requireAuth` | — | — |
| GET | `/api/projects/:id/usage` | `requireProjectMember` | — | `project_not_found` |
| PUT | `/api/admin/users/:id/plan-override` | `requirePermission('billing.subscription.write')` | `{ planId: string \| null }` | `user_not_found`, `plan_not_found` |

`BillingService`

- `resolvePlan(userId)` — **one branch**: `staff_override_plan_id ?? subscription.plan_id ?? default`.
  Every quota, limit and realm-tier read goes through it; nothing else reads `plan_id` directly. With
  the `billing` flag off it returns the default-slot role's limits and ignores the override (D8).
- `flagOverage(userId, bytes)` — sets `storage_overage_bytes` + `storage_overage_flagged_at`; clears
  both when usage drops back under the cap. Fire-and-forget from the storage check **and from
  `GET /api/account/usage`** — the write path alone cannot clear the flag, because a user who deletes
  files to get back under the cap never writes again and would otherwise keep a danger-toned navbar
  and a flagged subscription row forever. The usage read recomputes and clears; it is one `sum()` the
  endpoint already runs.

`AccessPolicyService`

- `assertWithinLimit(user, resource)` — unchanged shape, now typed to `AccountLimitedResource`.
- `assertWithinProjectLimit(project, resource)` — resolves the ceiling from `resolvePlan(project.ownerId)`,
  counts with `PROJECT_COUNT_SQL[resource]` bound to `project.id`, throws
  `ValidationError('project_limit_reached', [resource, used, limit])` → 400 with
  `encodeErrorCause('project_limit_reached', resource, used, limit)`.
- `assertStorageHeadroom(ownerId, addBytes)` → `StorageStatus`. `used + add < cap` → `ok`;
  `< cap × 1.5` → `grace` (allowed, `void this.billing.flagOverage(...)`);
  otherwise throw `ValidationError('storage_hard_cap_exceeded', [usedMb, capMb])`.
  **Callers pass the pending batch**, not the current total — the upload service sums the batch first.
  The batch is atomic: a single drop that would jump from `ok` past `cap × 1.5` is refused **whole**,
  never partially accepted up to the line. `grace` requires `plan.storage_overage_allowed` — a plan
  without it is hard-capped at `cap`, which is what that column is for.
- Ceilings apply to *creates*, never to what already exists (D4). A downgrade that leaves an account
  over its new cap keeps every read, edit and delete working; only the next upload or create refuses.
- Every limit read is TTL-cached exactly as today, and every write that touches `role_limits`,
  `user_limit_overrides`, plans, subscriptions **or `staff_override_plan_id`** calls
  `invalidate()`/`invalidateUser()`, which propagates across instances through the existing
  `LISTEN`/`NOTIFY` channel. The plan-override endpoint is the easiest of these to forget.

`AccessPolicyRepository`

- `COUNT_SQL: Record<AccountLimitedResource, string>` — `count-projects.sql`,
  `sum-storage-bytes.sql` (`SELECT coalesce(sum(a.size_bytes),0)::bigint AS c FROM assets a JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL WHERE p.owner_id = $1 AND a.upload_status = 'ready' AND a.deleted_at IS NULL`).
  It sums **`assets`** — the game-asset table (D9) — and never the admin-storage `files` table, whose
  avatars and invoice PDFs are not the user's game data and are not charged to a plan.
- `PROJECT_COUNT_SQL: Record<ProjectLimitedResource, string>` — `count-bundles.sql`,
  `count-configs.sql`, `count-members.sql`, each `WHERE project_id = $1 AND deleted_at IS NULL`.
- `count-tasks.sql` is deleted.

Side effects: `flagOverage` writes; no notification (the proposal does not ask for one — a flagged
overage surfaces in the usage panel, not the bell). Plan overrides are audited
(`recordAudit(actor, 'billing.plan_override', targetUserId)`).

## Web

- `state/billing.slice.ts` gains `usage: LimitUsage[]`, `projectUsage: Record<string, LimitUsage[]>`,
  `storage: StorageStatus | null`, `fetchUsage()`, `fetchProjectUsage(projectId)`. Anything that
  changes entitlements calls `void get().refreshSession()`.
- `hooks/useCan.ts` gains `useProjectLimits(projectId)` beside `useResourceLimits()`.
- Plan-limit modal: existing `MODAL.UPGRADE` handles the paywall; add `MODAL.PLAN_LIMIT` whose input is
  `{ resource, used, limit, planName }` and whose body is *"You have reached the limit for project
  members on your Studio plan. Current usage: 5 / 5."* with **Dismiss** / **View Subscription**.
  `helpers/api.ts` already turns the cause into copy — the slice sets the modal input from
  `parseErrorCause`.
- Navbar: a permanent usage button (`tc-popover` wrapping `tc-usage-summary-panel`) that turns
  danger-toned when `storage.verdict !== 'ok'` or any account resource is `reached`.
- `configs/strings.ts` gains a `usage` section (metric labels, grace-zone copy, the plan-limit modal
  copy) and the three new error codes in `ERROR_MESSAGES`.
- Client-observable used counts: account usage comes from `/api/account/usage`; project usage from
  `/api/projects/:id/usage`, cached in the slice per project and refetched after any create/delete in
  that project. That is what `<LimitMeter>` and the "hide Create new" gate read.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Usage bars (account + project) | `tc-usage-summary-panel` | `.claude/skills/web-components/specs/tc-usage-summary-panel.md` | `usage: UsageConfig[]` JS prop (`label`, `used`, `total`, `measurementUnit`, `warn`); `warn` forced when verdict is `grace` |
| Navbar usage popover | `tc-popover` | `specs/tc-popover.md` | Wraps the panel; trigger tinted danger on flagged overage |
| Headline figures | `tc-metric-grid` + `tc-metric-tile` | `specs/tc-metric-grid.md`, `specs/tc-metric-tile.md` | `items` JS prop; storage used, projects, members |
| Plan summary | `tc-stat-card` | `specs/tc-stat-card.md` | label/value/delta/helper/footer attributes |
| Plan cards | `tc-pricing-card` | `specs/tc-pricing-card.md` | `features` computed from plan limits (`∞` for `null`), `badge-text="POPULAR"` / `CURRENT`, marketing copy from `strings` |
| Plan-limit modal | `tc-modal` + `tc-alert` | `specs/tc-modal.md`, `specs/tc-alert.md` | `variant="warning"`; footer buttons are **direct children** of the modal |

No new React component — the catalog covers every element.

## Access policy

| Action | Guard |
| --- | --- |
| Read own usage | `requireAuth` |
| Read project usage | project membership (any member) |
| Set a staff plan override | `billing.subscription.write` |
| Read/write plans | existing `billing.plan.read` / `billing.plan.write` |

Ceilings per plan are the seed table above. Paid entitlement mapping: `PROJECT_LIMIT_ENTITLEMENT`
(`unlimitedProjects`) stays; add `STORAGE_LIMIT_ENTITLEMENT = { feature: 'moreStorage' }` and
`t.upgrade.features.moreStorage` copy.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `subscriptions`, `billing_plans` columns),
`sql/00002_seed.sql` (E: three roles + permissions + `role_limits` + plans + slot settings; drop the
`tasks`-era rows).

**api** — `contracts/limits.ts` (E), `contracts/errors.ts` (E), `contracts/billing.ts` (E),
`domain/access.ts` (E: `INTERNAL_SOFT_CAPS`, resolve helpers), `schema/billing.ts` (E),
`repositories/access/sql/count-projects.sql` (E), `sum-storage-bytes.sql` (C),
`count-bundles.sql` (C), `count-configs.sql` (C), `count-members.sql` (C), `count-tasks.sql` (D),
`repositories/access/AccessPolicyRepository.ts` (E: two typed maps + `countInProject`),
`repositories/billing/*` (E: override + overage columns),
`services/AccessPolicyService.ts` (E), `services/BillingService.ts` (E: `resolvePlan`, `flagOverage`),
`routers/billingRouter.ts` (E: usage + override endpoints), `routers/projectRouter.ts` (E: project usage).
`container.ts`/`http.ts` untouched — no new service or plugin.

**web** — `types/limits.ts` (E) + `types/index.ts` (E), `services/BillingService.ts` (E),
`state/billing.slice.ts` (E), `hooks/useCan.ts` (E), `configs/strings.ts` (E),
`configs/entitlements.ts` (E), `modals/keys.ts` (E), `modals/PlanLimitModal.tsx` (C),
`modals/index.tsx` (E), `modules/UsageSummary.tsx` (C), `modules/Navbar.tsx` (E),
`modules/Subscription.tsx` (E), `styles/modules/_usage.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/subscriptions-and-billing.md` (E), `docs/access-and-feature-flags.md` (E),
`docs/index.md` (E only if a new file is added).

## Verification

1. `npm run typecheck` — the partitioned `Record` types fail loudly if a `count-*.sql` is missing.
2. `dropdb starter && npm run migrate`; `npm run status -w @webgame-cloud/migrations`.
3. `curl -s localhost:6000/api/account/usage -b cookie | jq '.data'` → five resources, `storage_mb`
   with `used` in MB.
4. Seed a user on `indie`, upload 90 MB, then attempt a 20 MB batch: expect `200` with the
   subscription's `storage_overage_flagged_at` set (grace). Attempt another 60 MB: expect `400`
   `storage_hard_cap_exceeded`.
5. Create a second project on `indie`: expect `400` `limit_reached,projects,1` and the plan-limit
   modal in the browser; confirm **Create new** is *absent* from the switcher, not disabled.
6. Set a staff override to `studio` for that user, refetch usage: limits change without touching the
   subscription row.

7. Downgrade pass: put an account on `studio` with 4 projects, then staff-override it to `indie`.
   Every project still opens, edits and deletes; only **Create new** is gone and the usage panel shows
   4 / 1.
8. Delete enough assets to drop back under the cap, then `GET /api/account/usage` → the verdict returns
   to `ok` and `storage_overage_flagged_at` is cleared without any write to the assets table.
