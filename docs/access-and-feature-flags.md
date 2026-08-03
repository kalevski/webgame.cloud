# Access & feature flags

The authorization core. This is the most consequential system in the template and the one most apps re-implement badly — it is deliberately reusable as-is.

## Key files

- Contract: `api/src/contracts/permissions.ts` (`PERMISSIONS`, `ACCOUNT_SHAPED`), `roles.ts` (`ROLE_SLOTS`, `SEED_ROLES`, `SEED_ROLE_BINDINGS`, `toRoleId`), `limits.ts` (`LIMITABLE_RESOURCES`, `RESOURCE_LABELS`, `AccessPolicy`).
- Resolver: `api/src/domain/access.ts` — `resolvePermissions`, `resolveLimits`, `isInSlot`, `permissionsOfRole`.
- Service/cache: `api/src/services/AccessPolicyService.ts` — the policy cache, role CRUD, bindings, per-user overrides, `assertWithinLimit`.
- Repository: `api/src/repositories/access/AccessPolicyRepository.ts` — SQL + the `COUNT_SQL` map.
- Admin API: `api/src/routers/accessPolicyRouter.ts` (`/api/roles`, `/api/access-policy`, `/api/users/:id/access`).
- Web admin UI: `web/src/modules/AccessPolicyAdmin.tsx`, `web/src/modals/ManageAccessModal.tsx`.
- Web paywall: `web/src/configs/entitlements.ts`, `web/src/hooks/useLock.ts`, `web/src/modals/UpgradeModal.tsx`, `web/src/components/{LockChip,LockedAction,UpgradeNudge}.tsx`.
- Web usage panel: `web/src/modules/UsageSummary.tsx`, `web/src/styles/modules/_usage.scss`.

## Model

There is ONE authorization axis: the **role**, a database ROW (`roles` table) created and renamed at runtime. A role grants a set of **permission keys** (`role_permissions`). No separate tier/plan dimension.

- **Permissions** (`PERMISSIONS`) are booleans — "may this account do X at all". Keys are `domain.resource.action`, STABLE FOREVER. `useCan(key)` / `request.can(key)` check them. Never branch on a key's *shape*.
- **Limits** (`LIMITABLE_RESOURCES`) are numbers — "how many". `null` = unlimited. Adding a resource is a registry entry **plus** a `count-*.sql` in the `COUNT_SQL` map — the compiler enforces the pair.
- **Slots** (`ROLE_SLOTS`: `default`) are identity — behaviour that depends on WHICH role, not what it may do. The owner binds each slot to a role; new signups get the `default` role. There is no "paid role" slot: paid identity comes from an active subscription (`AuthSession.paid`) and each PLAN binds its own role, listed alongside the slots in `/admin/access`.

## The catalog

Keys are grouped by their first dot segment; the admin UI groups the chips by that prefix (labels in `strings.accessAdmin.groups`). Reads and writes are separate keys throughout, so a role can be given platform *visibility* without the ability to change anything.

| Group | Keys | Gates |
| --- | --- | --- |
| `project` / `task` | `project.write`, `project.share`, `project.export`, `task.write` | the example feature (`projectRouter`) |
| `moderation` / `audit` | `moderation.queue.read`, `moderation.report.resolve`, `audit.read` | `/moderation`, the audit log |
| `admin` | `admin.overview.read`, `admin.user.read`, `admin.user.role.write`, `admin.user.impersonate`, `admin.role.read`, `admin.role.write`, `admin.settings.read`, `admin.settings.write`, `admin.feature.write`, `admin.service.read`, `admin.service.write` | the `/admin/*` tabs: overview, users, *Access & limits* (roles, limits, slots), *Settings* (platform settings, product flags), *Service accounts* (see service-accounts.md) |
| `billing` | `billing.plan.read`, `billing.plan.write`, `billing.subscription.read`, `billing.subscription.write` | plan CRUD and reading/setting any account's subscription |
| `invoice` | `invoice.read`, `invoice.write` | `/platform/invoices` and invoice create / mark-paid / void |
| `enquiry` | `enquiry.read`, `enquiry.write` | `/platform/enquiries`, its audit trail, and recording actions on an enquiry |
| `email` | `email.outbox.read`, `email.send`, `email.template.write`, `email.trigger.write`, `email.config.write` | `/platform/email`: outbox/templates/triggers reads, composing and retry/cancel, template CRUD, trigger CRUD, the *Delivery* tab (provider credentials) |

A user's OWN invoices, subscription and checkout (`/billing`) are self-scoped and need no permission — only `requireAuth` plus the `billing` product flag. The same holds for notifications and account self-service.

The seeded `maintainer` role demonstrates the split: every `*.read` key across admin, billing, invoice, enquiry and email, plus moderation — and no write key, so it sees every platform page with its action buttons hidden and its API writes rejected.

## Resolution (domain/access.ts)

```
role's permission set (role_permissions)  →  per-user deltas (user_permissions, add/subtract)
```

Two things are applied OUTSIDE the data so no admin-writable row can violate them:
- an inactive account resolves to the empty set;
- `owner` resolves to the whole catalog minus `ACCOUNT_SHAPED`, **computed, never stored** — a permission added tomorrow is owner-granted the moment it exists.

A service account resolves through this exact path — it is a `users` row with `kind = 'service'`, so its role
grant and its `user_permissions` deltas are read by the same `resolvePermissions` (see service-accounts.md).
Only the owner role is barred from it.

Limits resolve the same way (`role_limits` → `user_limit_overrides`). `AccessPolicyService.assertWithinLimit(user, resource)` is the single enforcement point; it throws a `409 limit_reached`.

The screen is two cards: **Roles** (the role list and the selected role's editor, *New role* in the card's
`action` slot) and **Role bindings** (the slot → role selects plus their save). Both used to paint their own
bordered box inside the tab; the cards carry that chrome now, so the list is not a box inside a box.

**In the editor, `0` means unlimited.** A role with no `role_limits` row is unlimited, and `tc-module-access` renders a missing quota as `0` — so the *Access & limits* screen shows `0` for "no cap". The save path in `AccessPolicyAdmin` mirrors that: it persists only values `> 0`, so a `0` left in the box is dropped and the resource stays uncapped. A `tc-helper-text` under the editor states the rule.

The consequence worth knowing: **the UI cannot express a genuine quota of zero**, even though the API supports it (`assertWithinLimit` blocks at `0`, since `used >= 0` always holds). To forbid a resource outright, withhold the capability (`project.write`) rather than setting a `0` quota. Do not "fix" this by persisting `0` from the editor — every unlimited role currently displays `0`, so that change would silently convert them all into hard blocks on the next save.

## The paywall (web)

`configs/entitlements.ts` maps a withheld PAID capability (e.g. `project.export`) or a quota to copy in `strings.upgrade.features`. The plan offered comes from `AuthSession.upgradePlanName`, so a lock only appears when a purchasable plan exists. `useLock(permission)` / `useLimitLock(reached, entitlement)` return `{ locked, roleName, open }`; a component hands that to `LockedAction`/`UpgradeNudge`, which show a `LockChip` and open the one `UpgradeModal`. A capability withheld by an ORDINARY (non-purchasable) role is hidden with plain `useCan`, never locked.

## Two different things called "feature flags"

- **Capability flags** — everything on this page. Per-role/per-user permission keys and quotas, resolved per caller. "Can *this account* do X."
- **Product flags** — `contracts/features.ts` + `FeatureService` (`billing`, `email`), toggled in `/admin/settings`. Workspace-wide on/off switches for whole slices of the product, resolved once per request and shipped to the client on `/api/config`. "Does this *deployment* have X at all." Server gate `requireFeature(flag)` (404), client gate `useFeature(flag)`. See subscriptions-and-billing.md.

They compose: the billing flag decides whether subscriptions exist here; an active subscription then moves the account into the role bound to its plan, and the capability system takes over from there.

## Where the paid role comes from

Nothing grants a plan role on its own — an owner sets it by hand, or (when the billing flag is on) `BillingService.syncRole` sets it from an active subscription and drops it back to the `default` role when that subscription ends. Details in subscriptions-and-billing.md.

With the billing flag on, the *Slots* panel in `/admin/access` grows one row per plan ("Plan: Plus") binding the role that plan grants, and a *Plans* section below it for creating them. A plan is `manual` (sales assigns it) or `managed` (payment gateway) — the two can be mixed.

## Adding a capability

1. Add the key to `PERMISSIONS`.
2. Grant it to the relevant `SEED_ROLES` and re-seed (`00002_seed.sql`).
3. Gate the route with `requirePermission('your.key')` and gate the UI with `useCan('your.key')`. Add a `strings.accessAdmin.groups` label if the key opens a new group prefix.
4. If it should be sellable, add an `ENTITLEMENTS` entry + `strings.upgrade.features` block.

Adding a *role* needs no code — the owner creates it in the admin UI. Adding a *permission key* is the only part that needs a deploy.


## Two permission planes

This workspace has a second, project-scoped plane on top of the platform one documented above. Platform
permissions are role grants; project permissions are **row data** on `project_members.permissions`. See
[projects-and-members.md](projects-and-members.md) — including the compile-time guard that keeps the two
key spaces disjoint.

## Account-scoped vs project-scoped limits

`LIMITABLE_RESOURCES` is partitioned:

- `ACCOUNT_LIMITED` — `projects`, `storage_mb`. Counted per user, resolved from the caller's plan.
- `PROJECT_LIMITED` — `bundles_per_project`, `configs_per_project`, `members_per_project`. Counted per
  project, and the ceiling always resolves from the **project owner's** plan, never the caller's.

Ceilings (`role_limits`, `user_limit_overrides`, both admin editors) keep the full union. *Usage* types
(`ResolvedLimits`, `countAll`, `UserAccessPayload.usage`) narrow to the account-scoped half — there is no
per-user count of a project-scoped resource.

Where a plan leaves a limit `null`, `INTERNAL_SOFT_CAPS` (`domain/access.ts`) applies a ceiling that is
never surfaced in any payload.

**Downgrades never destroy or lock data.** When a plan change leaves an account over its new ceiling,
existing resources are grandfathered: reads, edits and deletes keep working, only creates and uploads
refuse, and the usage panel shows the overage.

## The usage panel (web)

`modules/UsageSummary.tsx` renders a gauge button in `MainLayout`'s `navbar-right` slot, between the
command-palette hint and the notification bell, and opens a dropdown built the same way
`NotificationsBell` is — local `open` state, an outside-click/Escape listener on `document`, and a
`tc-scroll-area` around the body. It is the read-only counterpart to `assertWithinLimit`: the paywall
tells a caller it *has* run out, this tells them they are *about* to.

It shows up to two `tc-usage-summary-panel`s:

- **Your account** — `GET /api/account/usage` (`billingRouter.accountUsageEndpoint`, typed
  `AccountUsage`), which is `AccessPolicyService.usageFor` plus `storageStatus`. Only the `usage` half is
  read; `storage` is available on the same response for a future storage-specific surface. Cached in
  `billing.slice` as `accountUsage` / `accountUsageLoaded`.
- **Project — \<name\>** — `GET /api/projects/:id/usage`, already wired as `projects.slice.projectUsage`
  keyed by project id. It appears only when a project is active (`activeProjectId`, set by
  `ProjectSwitcher`), so the panel follows the switcher rather than the current route.

Both are refetched when the dropdown opens, so a build or upload made minutes ago is reflected without a
page reload.

**Unlimited resources are dropped, not drawn.** `tc-usage-summary-panel` takes a required numeric
`total`, and a `null` limit has no bar to fill — `toRows` filters those entries out. An account whose
plan sets no ceilings therefore renders no panel at all, and the module says so
(`strings.usagePanel.unlimited`) rather than showing an empty box. Storage is the one row with a unit:
`usageFor` already converts `storage_mb` to whole MB, so the module only supplies the label.

**The 90 % rule** is `USAGE_WARN_RATIO` in `contracts/limits.ts`, shared so the client threshold cannot
drift from anything the server later enforces at the same boundary. A row at or above it gets
`warn: true` (the component's own amber styling, which it also applies on its own once `used >= total`);
any warning row puts a dot on the navbar button and reveals a *See plans* footer that navigates to
`/billing`. That footer is additionally gated on `useFeature('billing')` — with the product flag off
there are no plans to send anyone to, so the warning shows without the button.

**Styling it needs two classes, not one.** The package ships
`tc-theme[name=blueprint] tc-usage-summary-panel` (specificity 0,1,2) setting every
`--bs-usage-summary-panel-*` hook, and the app renders inside `<tc-theme name="blueprint">`. A single-class
override (`.module-usage tc-usage-summary-panel`, 0,1,1) loses to it — silently, and only for the
variables the theme happens to set, which reads as "some of my overrides work". `_usage.scss` uses
`.module-usage .module-usage__body tc-usage-summary-panel` to clear the bar. This is the specificity
sibling of the element-scoped variable trap in
[landing-and-waitlist.md](landing-and-waitlist.md) — the variables are declared on the element itself, so
setting them on an ancestor never wins either.
