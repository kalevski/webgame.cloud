# Storage measured in megabytes, and charged for

> Byte-metered quotas, the grace zone, and what a user sees when they run out.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What the user sees

The subscription tab shows the plan, its status, the next billing date, and an **Account limits**
card listing each metric with usage against its limit. A `null` limit means unlimited — it renders as
**"Unlimited"** with no progress bar in the limits card, and as **`∞`** on the plan cards.

Plan copy is split deliberately. The *numbers* come from the API (`GET /billing/plans`), and the
feature bullets are computed from the plan's own limits — `2 GB Storage`, `∞ Projects`,
`3 Bundles / Project`. The *marketing words* are static configuration: "For solo developers
prototyping their first game." / "For developers shipping real games to real players." / "For studios
shipping multiple titles at scale.", with a `POPULAR` badge on Indie+ and `CURRENT` on the active
plan. Each feature bullet also carries a one-line subtitle — "room for production assets", "your
whole studio" — rendered under its label.

There is also a permanent **Usage summary** button in the navbar that opens an Account Usage /
Project Limits popover, and turns solid red when the server flags `suggestedUpgrade`.

Plans:

| Plan | Price | Storage | Projects | Bundles/project | Configs/project | Members/project |
| --- | --- | --- | --- | --- | --- | --- |
| Indie | free | 100 MB | 1 | 1 | 2 | 1 |
| Indie+ | $6.99/mo | 1 GB | 3 | 3 | 10 | 3 |
| Studio | $49.99/mo | 10 GB | ∞ | ∞ | ∞ | ∞ |
| Studio storage add-on | $3.00/GB | +1 GB each | — | — | — | — |

Every new account is seeded onto `indie/active` automatically, best-effort, at first sign-in — a
billing failure never blocks signup.

## Hitting a limit

Any slice that catches the `billing.plan_quota_exceeded` cause sets a "which metric" flag, and a
global handler opens a **Plan Limit Reached** modal — *"You have reached the limit for project
members on your Studio plan. Current usage: 5 / 5."* with **Dismiss** / **View Subscription**.

**Every quota-bearing action raises it** — create project, invite member, create config, create
bundle, run a build, and upload past the storage cap. Running out of storage is not allowed to
surface as a generic upload failure; it names the metric and offers the upgrade path like any other
limit.

A softer gate does exist: the sidebar's project dropdown hides "Create new" once the project count
reaches the limit.

## Storage is checked differently from everything else

Two things make storage special:

**It is checked against the incoming batch, not the current total.** `UploadsService` calls
`checkQuota(ownerId, storage_mb, currentStorageMb + batchMb)`. Counting *things* can ask "am I at the
limit?"; counting *bytes* must ask "will this upload put me over?".

**It has a grace zone.** The gate is two-tier, not a hard wall:

| Usage | What happens |
| --- | --- |
| below the plan cap | allowed |
| at or above the cap, below `cap × 1.5` | **allowed, but the overage is flagged** on the subscription |
| at or above `cap × 1.5` | blocked with `billing.storage_hard_cap_exceeded` |

So a free user with 100 MB is not cut off at 100 MB — they are flagged at 100 and blocked at 150.
Every plan gets the grace zone; only plans with `storage_overage_allowed` (Studio) get the paid
add-on path out of it.

Inside the grace zone the overage is **flagged, not billed**. Turning flagged overage into revenue is
the Studio storage add-on, which the user buys explicitly — there is no automatic metered charge.

## Unlimited is not unlimited

A `null` limit means "unlimited" to the user, but internally an `INTERNAL_SOFT_CAPS` map still
applies (roughly 100 projects, 1,000 bundles, 10,000 configs). Real customers never reach these; they
exist so a script cannot fill the database. They are never surfaced.

## The support escape hatch

`subscriptions.staff_override_plan_id` lets staff hand a user any plan, and **it wins over the real
subscription everywhere** — quotas, limits, realm tier selection. One column and one branch in plan
resolution, and support can fix a customer without touching the payment provider.

## How usage is actually counted

Usage is **computed live** from the rows themselves — storage as `sum(file_size) / 1048576`, every
other metric as a count — at both account and project scope. A maintained counter would be cheaper to
read but can drift from the truth; a live sum cannot.

---

## Screens & components

Screen: **Storage & quotas**

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

| Region | Component | Notes |
| --- | --- | --- |
| Usage panel | `tc-usage-summary-panel` | Purpose-built: labelled progress bars from a `usage` JS property |
| Navbar summary | `tc-popover` wrapping the panel | Turns danger-toned when the server flags an upgrade |
| Headline figures | `tc-metric-grid` + `tc-metric-tile` | Storage used, projects, members |
| Plan summary | `tc-stat-card` | Label, value, delta, helper, footer |
| Quota reached | `tc-modal` + `tc-alert` | Names the metric, the plan and the numbers, and links to the subscription screen |
