# Subscriptions & billing

A complete subscription surface — plans, per-user subscriptions, checkout, cancel, expiry, invoices, and role sync — that works **with no payment provider attached**. Selling is manual by default: a plan is assigned by sales, and the account sees a *contact sales* screen. A gateway is an implementation of one port (`domain/billing.ts`); register one and any plan marked `managed` starts using it. Manual and managed plans coexist in the same workspace.

The whole feature — API, profile tab, admin sections and the Platform nav group — sits behind the `billing` feature flag and is **off by default**.

## Key files

- Contracts: `api/src/contracts/billing.ts` (`Plan`/`PlanDraft`/`PlanMode`, `Subscription`, `CheckoutIntent`, `Invoice`/`InvoiceFilters`, statuses), `api/src/contracts/features.ts` (`FEATURE_FLAGS`, `FeatureFlags`, defaults).
- API: `api/src/domain/billing.ts` (the port + `manualBillingPort`), `api/src/services/BillingService.ts`, `api/src/services/FeatureService.ts`, `api/src/repositories/billing/BillingRepository.ts`, `api/src/routers/billingRouter.ts`, `api/src/features.ts` (`requireFeature`).
- Schema: `billing_plans`, `subscriptions`, `invoices` (`migrations/sql/00001_schema.sql`); one seeded manual plan, `feature_billing=false`, empty `sales_contact` (`00002_seed.sql`).
- Web: `web/src/services/BillingService.ts`, `web/src/state/billing.slice.ts`, `web/src/hooks/useFeature.ts`, `web/src/modules/BillingPanel.tsx` (Billing tab of `/profile`), `web/src/modules/PlansAdmin.tsx` + the plan slots in `web/src/modules/AccessPolicyAdmin.tsx` (`/admin/access`), `web/src/modules/InvoicesAdmin.tsx` + `web/src/pages/InvoicesPage.tsx` (`/platform/invoices`), `web/src/modules/FeatureFlagsPanel.tsx` (`/admin/settings`).

## Feature flags

Flags are `settings` rows keyed `feature_<flag>`, catalogued in `contracts/features.ts` (`FEATURE_FLAGS` + `FEATURE_FLAG_DEFAULTS`). `FeatureService` reads them through `SettingsService` behind a 10s cache and invalidates on write.

- Read (everyone): flags ride along on `GET /api/config` as `AuthConfig.features`, so the SPA already has them at boot — no extra request. Client gate: `useFeature('billing')`.
- Read `admin.settings.read`, write `admin.feature.write`: `GET`/`PUT /api/settings/features`. Every write is audited (`update_feature_flags`).
- Server gate: `requireFeature(flag)` is a `preHandler` that replies **404 `feature_disabled`** — a disabled feature looks absent, not forbidden.

Adding a flag: add the literal to `FEATURE_FLAGS`, a default to `FEATURE_FLAG_DEFAULTS`, copy to `strings.featureFlags.labels`/`hints` (both are `Record<FeatureFlag, string>`, so the compiler catches a missing entry), and a seed row in `00002_seed.sql`. The admin card renders itself from the catalog.

The admin UI is the *Feature flags* section of `/admin/settings` (`FeatureFlagsPanel`), one `tc-toggle-card` per flag. Saving re-fetches `/api/config` so gated UI appears or disappears without a reload.

## Data model

- `billing_plans` — `id`, `name`, `description`, `role_id` (FK to `roles`, the role a subscriber is granted), **`mode`** (`manual`/`managed`), `price_cents`, `currency`, `interval` (`month`/`year`), `position`, `active`, **`features`** (jsonb string array shown on the pricing card) and **`sales_fields`** (jsonb `SalesField[]` — the custom application form a manual plan asks for). Seeded with one plan: `plus` → role `member_plus`, $9/month, `manual`. The owner creates and edits plans at runtime in `/admin/access` → *Plans*; `mode` defaults to `manual`.
- `sales_enquiries` — one row per plan application: `plan_id`, `user_id`, `status` (`new`/`contacted`/`won`/`lost`), `answers` (jsonb, keyed by the plan's `SalesField.key`). A partial unique index — `sales_enquiries_open_unique_idx ON (user_id) WHERE status IN ('new', 'contacted')` — allows **one open enquiry per account**; closing it (`won`/`lost`) frees the account to apply again.
- `sales_enquiry_events` — the append-only audit trail of one enquiry: `kind` (`created`/`status`/`note`/`invoice`), `actor_id`/`actor_name`, `status`, `note`, `invoice_id`. The `created` row is written when the application arrives; every admin action appends one.
- `invoices` — `number` (generated `INV-<yyyymm>-<hex>`), `public_token` (unguessable handle behind the public printable page), `user_id`, `plan_id`, `status` (`draft`/`open`/`paid`/`void`/`uncollectible`), `provider`, `provider_invoice_id`, `amount_cents`, `currency`, `issued_at`, `due_at`, `paid_at`. One invoice is issued automatically whenever a subscription transitions **into** an active state; admins can also raise one by hand.
- `subscriptions` — one row per user (`user_id` PK): `plan_id`, `status` (`none`/`trialing`/`active`/`past_due`/`canceled`), `provider`, `provider_customer_id`, `provider_subscription_id`, `cancel_at_period_end`, `current_period_end`, `started_at`. The two `provider_*` columns exist so a real gateway has somewhere to put its identifiers on day one.

## The provider port

```ts
export type BillingPort = {
    id: BillingProvider
    startCheckout(request: CheckoutRequest): Promise<CheckoutIntent>
    cancel(subscription: ProviderSubscription): Promise<ProviderSubscription>
    resume(subscription: ProviderSubscription): Promise<ProviderSubscription>
}
```

`CheckoutIntent.outcome` is the contract between any provider and the UI:

- `redirect` — the web app sends the browser to `redirectUrl` (hosted checkout).
- `activated` — the subscription is live already (a provider that settles inline, or a comp flow).
- `contact_sales` — a **manual** plan. The web app does not even call checkout for these: clicking the plan opens `ContactSalesModal`, which renders the plan's `salesFields` and posts an enquiry. The outcome still exists so a provider can return it.
- `unavailable` — a **managed** plan with no gateway registered: the UI says *upgrades are currently unavailable*. `BillingService.startCheckout` short-circuits to this before touching any port.

Ports live in a registry (`registerBillingPort` / `getBillingPort`); `manualBillingPort` registers itself. Which port a managed plan uses comes from the `billing_provider` setting — unset or `manual` means "no gateway", so managed plans stay `unavailable` until both the setting names a provider AND that provider is registered.

To integrate a real provider:

1. Add its id to `BILLING_PROVIDERS` (`contracts/billing.ts`).
2. Implement `BillingPort` and call `registerBillingPort(yourPort)` at boot.
3. Set the `billing_provider` setting to that id.
4. Add a webhook route that calls `BillingService.applySubscription(userId, patch)` — the single write path for subscription state — and `createInvoice`/`setInvoiceStatus` for billing documents.

Plans stay per-plan: leave a plan on `manual` and sales assigns it even while another plan checks out through the gateway.

## Endpoints

All under `requireFeature('billing')` + `requireAuth`:

- `GET /api/billing/plans` — active plans, ordered.
- `GET /api/billing/subscription` — the caller's subscription (`NO_SUBSCRIPTION` when there is no row).
- `GET /api/billing/my/invoices` — the caller's own invoices, same filter/paging shape as the admin list but always scoped to `request.user` (a `userId` in the querystring is ignored, so it cannot be widened).
- `POST /api/billing/checkout` `{ planId }` → `CheckoutIntent`. Rejects `already_subscribed` when the caller is already active on that plan, `plan_not_found` otherwise.
- `POST /api/billing/enquiries` `{ planId, answers }` — submit a plan application. Required `salesFields` missing → `answers_required` with the field label. An account that already has an open enquiry (any plan) gets `409 enquiry_exists` with the open enquiry's id — `BillingService.createEnquiry` looks it up first, and the partial unique index makes the check race-proof (a concurrent insert comes back as the repository's `'open'` conflict sentinel and maps to the same error).
- `GET /api/billing/my/enquiry` → `{ enquiry: SalesEnquiry | null }` — the caller's own open enquiry, or `null` once it is won or lost. This is what the billing screen reads to decide whether *Contact sales* is still available.
- `POST /api/billing/cancel` — cancels through the port; `not_subscribed` (409) when there is nothing active.
- `GET` (`billing.subscription.read`) / `PATCH` (`billing.subscription.write`) `/api/billing/subscriptions/:userId` — read or set any user's subscription: `{ status, planId?, currentPeriodEnd? }`. This is how a manual plan is assigned after a sales conversation, and it is audited (`update_subscription`).

Admin-only and audited — plans read with `billing.plan.read` and written with `billing.plan.write`, invoices read with `invoice.read` and written with `invoice.write`:

- `GET /api/billing/admin/plans` — every plan including unpublished ones (`GET /api/billing/plans` returns only `active` ones).
- `POST /api/billing/plans` / `PATCH /api/billing/plans/:planId` / `DELETE /api/billing/plans/:planId` — plan CRUD. The id is slugged from the name (`toRoleId`); deleting a plan with active subscribers is refused with `plan_in_use`.
- `GET /api/billing/invoices` — filterable list returning `{ invoices, total }`. Filters: `userId`, `planId`, `status`, `provider`, `from`, `to`, `q` (matches invoice number, account name or email), `limit`, `offset`.
- `POST /api/billing/invoices` — raise an invoice by hand; amount and currency default to the plan's.
- `PATCH /api/billing/invoices/:invoiceId` — set status; `paid` stamps `paid_at`.
- `GET /api/billing/admin/enquiries` — filterable applications (`status`, `planId`, `q` over name/email/answers) returning `{ enquiries, total }`; `PATCH /api/billing/enquiries/:id` sets the status (audited).

Enquiry follow-up (read `enquiry.read`, write `enquiry.write`):

- `GET /api/billing/enquiries/:id/events` → `SalesEnquiryEvent[]`, newest first — the audit trail of one application.
- `POST /api/billing/enquiries/:id/actions` `{ kind, status?, note?, amountCents?, currency? }` → `{ enquiry, event, invoice }`. Three kinds: `status` (moves the enquiry and records who moved it), `note` (a plain note, required non-empty), `invoice` (raises an invoice for that account and plan — amount and currency default to the plan's — and links it to the event). Every action is audited as `sales_enquiry_action`.

Public, **no auth** (never behind the flag — it reports the flag):

- `GET /api/public/constants` → `PublicConstants`: `{ workspace, features, plans }`. The one endpoint public pages read. `plans` is empty unless the `billing` flag is on, so a workspace with billing off leaks nothing. The landing page renders these as `tc-pricing-card`s.

Public, **no auth** (behind the feature flag):

- `GET /api/billing/public/invoices/:token` → `PublicInvoice` — the printable invoice behind `invoices.public_token`. It exposes only what belongs on an invoice (number, account name/email, plan, amount, dates, workspace name from `WORKSPACE_NAME`), never internal ids.

## Role sync — how a subscription grants anything

`BillingService.syncRole` runs after every write:

- status becomes active/trialing with a plan that has a `role_id` → the user's role is set to that role, `AccessPolicyService.invalidateUser` clears their cached permissions.
- status leaves active/trialing → if the user currently holds a **plan role**, they drop back to the role bound to the `default` slot.
- `owner` is never touched, and a role that is not a plan role (e.g. `maintainer`) is never demoted.

There is no longer a "paid role" slot. `GET /api/auth/me` reports `paid` (does this account hold an active subscription) and `upgradePlanName` (the plan the paywall offers); `useAuth().isPaid` and `useLock` read those. Plans are bound to roles individually — see *Plans appear as slots* below and access-and-feature-flags.md.

Expiry: `MaintenanceService`'s hourly sweep calls `BillingService.expireDue()`, which cancels every active subscription whose `current_period_end` has passed (and therefore downgrades the role).

## Plans appear as slots

`/admin/access` → *Slots* lists the fixed behavioural slot (`default`) **and one row per plan** — "Plan: Plus" — whose select binds the role that plan grants. Saving writes the slot settings and any changed `plan.roleId` in the same click. The hint under each plan row states whether it is sold manually or through the gateway. Plan CRUD itself is the *Plans* section directly below (`PlansAdmin`).

Both sections only render when the billing flag is on.

## Web surface

- `/billing` (`BillingPage`, reached from the **Billing** item in the user-panel menu; both the route and the menu item are gated on `useFeature('billing')`, and `/profile/billing` redirects here) is split into two route tabs: **Subscription** (`/billing`) and **Invoices** (`/billing/invoices`, `MyInvoices` — a `tc-advanced-table` of the account's own invoices with a status filter, pagination and a per-row preview button that opens the printable `/invoice/:token` page in a new tab).
- The Subscription tab (`BillingPanel`): current plan summary, then one `tc-pricing-card` per plan (features, price, mode badge). A manual plan's button opens `ContactSalesModal` — the plan's `salesFields` rendered as a form, validated client- and server-side. A managed plan runs checkout; with no gateway registered the panel shows *Upgrades are currently unavailable*.
The plan cards on `/billing` disable the manual-plan action while `myEnquiry` is set (label becomes *Request sent*) and show the pending line above the grid, so the block is visible before the user submits and the 409 is only the backstop.

- `/platform/enquiries` (`EnquiriesAdmin`) — the applications queue: `tc-advanced-table` with search/status/plan filters and two icon buttons per row — **Audit trail** (`EnquiryTrailModal`, the event history) and **Add action** (`EnquiryActionModal`: change status / add a note / create an invoice, with an optional note on all three). The library has no `tc-icon-button`; these are icon-only `tc-button`s injected into the row HTML with `data-enquiry`/`data-action` attributes and handled by one delegated click handler on the module root.
- `/invoice/:token` (`PublicInvoicePage`) — public, unauthenticated, print-styled invoice sheet with a Print button (`@media print` hides the chrome).
- The landing page (`modules/Landing.tsx`) shows a *Plans* band built from `GET /api/public/constants` — no session required; the section disappears when billing is off or no plan is published.
- Plans are created and edited in `PlanModal` (opened from the *Plans* section of `/admin/access`). Application fields are edited as rows — each row is a question, an answer type (short text / long text / email / number) and a Required switch, with per-row Remove and an Add field button (max 12). The stored `SalesField.key` is slugged from the question label on save, so renaming a question renames its answer key.
- `/platform/invoices` (`InvoicesAdmin`, page `InvoicesPage`) under the **Platform** group in the side nav — visible only with the flag on AND `invoice.read`; the *Mark paid* / *Void* row actions additionally need `invoice.write`. A `tc-advanced-table` with server-side filters (search, status, plan, issued-from, issued-to), pagination, status badges and per-row *Mark paid* / *Void* actions. Row markup is fed through the table's `rows` string property (escaped with `helpers/html.escapeHtml`), never as React children — see frontend-architecture.md.
- `salesContact` is a `PlatformSettings` field edited in `/admin/settings`; it is what the contact-sales panel offers.

## Verifying locally

```bash
curl -s -b c.txt localhost:5000/api/billing/plans | jq '.data'          # 404 feature_disabled while the flag is off
curl -s -b admin.txt -X PUT localhost:5000/api/settings/features \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:5000' -d '{"billing":true}'
curl -s -b admin.txt -X PATCH localhost:5000/api/billing/subscriptions/<userId> \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:5000' \
    -d '{"status":"active","planId":"plus","currentPeriodEnd":"2026-12-31T00:00:00.000Z"}'
```

The second call promotes that user to `member_plus`, issues an invoice, and `POST /api/billing/cancel` as that user drops them back to `member`.

```bash
curl -s -b admin.txt 'localhost:5000/api/billing/invoices?status=open&q=member' | jq '.data'
```

## Billing depth: trials, coupons, usage, proration, dunning

Five extras live in `BillingService`. They are at different stages of wiring, and the difference matters —
some are live, some are building blocks a derived project has to call.

**Trials — live.** A plan carries `trialDays`. When checkout activates a subscription with `trialDays > 0`
the row is created `status: 'trialing'` with `currentPeriodEnd` set that many days out. `ACTIVE_SUBSCRIPTION_STATUSES`
counts `trialing` as active, so a trialling user has the plan's role and entitlements immediately, and the
`subscription_expiry` cron job (background-jobs.md) ends the subscription when the period runs out.

**Coupons — partly wired.** `coupons` and `coupon_redemptions` exist, with owner CRUD
(`GET/POST/DELETE /api/billing/coupons`, `billing.plan.write`) and a public
`GET /api/billing/coupons/preview?code=&amountCents=` that returns the computed discount. `percentOff` and
`amountOff` are both supported; `discountFor` applies percentage first and clamps a fixed amount to the
invoice total. **`BillingService.redeemCoupon` has no route**, so nothing consumes a coupon today — a code
can be created and previewed, never spent. Wiring redemption into checkout (or into invoice creation) is
the missing step, and `coupon_redemptions` already has the one-per-user unique guard for it.

**Usage metering — read side only.** `GET /api/billing/my/usage` and
`GET /api/billing/usage/:userId` (`billing.subscription.read`) aggregate `usage_events` over a date range.
**`BillingService.recordUsage(userId, resource, quantity)` is never called by the template** — it is the
hook a derived project calls when a billable action happens. Nothing populates the table on its own, so the
endpoints return empty until you do.

**Proration and dunning — implemented, not invoked.** `prorationCredit(userId)` computes the unused
remainder of the current period, and `sendDunning()` walks `DUNNING_STAGES` (1, 7 and 14 days past due),
mails the matching template through the email slice and records each notice in `invoice_reminders` so a
stage never repeats. **Neither has a caller.** Proration needs to be applied wherever a derived project
implements a plan switch; dunning wants a cron job — `registerJobHandler('dunning', …, { cron: '0 9 * * *' })`
is the intended shape, and is one of the reasons the job registry takes a cron expression.

Treated honestly, that means the billing surface ships a complete *manual* lifecycle plus the arithmetic
for the rest. Don't assume an invoice chases itself.
