# Users, account & settings

## Key files

- API: `api/src/routers/userRouter.ts` (admin surface), `api/src/routers/accountRouter.ts` (self-serve), `api/src/services/{UserService,AccountService,AdminOverviewService,SettingsService}.ts`, `api/src/repositories/users/{UserRepository,SessionRepository}.ts`, `api/src/repositories/account/AccountRepository.ts`.
- Web: `web/src/services/UserService.ts`, `web/src/state/{users,auth}.slice.ts`, `web/src/modules/{UsersAdmin,AdminWorkspace,AdminOverview,PlatformSettingsPanel,Profile,AccountSettings,DeviceSessions}.tsx`, `web/src/modals/{CreateUserModal,ManageAccessModal,ConfirmImpersonateModal,ConfirmDeleteAccountModal}.tsx`.

## Admin user directory (`userRouter.ts` → `UserService`)

- `GET /api/users` (`admin.user.read`) — the directory.
- `POST /api/users` (`admin.user.role.write`) — pre-provision an account by email; claimed on first sign-in via the email match in `resolveUser`.
- `POST /api/users/:id/impersonate` (`admin.user.impersonate`) — swaps the admin's session for the target's; one-way (the way back is logout + login). Never a ladder into an owner account.
- `PATCH /api/users/:id` (`admin.user.role.write`) — role / active / verified. Enforces two invariants: nobody edits their own access, and **the last active owner may never be demoted or deactivated** (`UserRepository.countActiveOwners`). Deactivating clears the user's sessions.

Per-account access (permission/limit overrides) is written through `ManageAccessModal` → `PUT /api/users/:id/access` (see access-and-feature-flags.md), not here.

## Self-serve account (`accountRouter.ts`)

`POST /api/account/consent`, `PUT /api/account/name` (the only field a user writes on their own row), `GET /api/account/export` (every row they own, as JSON — including linked identities), `DELETE /api/account`, `GET /api/account/identities` + `DELETE /api/account/identities/:provider` (connected OAuth logins — see the auth doc's *Linked identities* section for the rules), `GET /api/account/sessions` + `DELETE /api/account/sessions/:id` (active devices — see the auth doc's *Active devices* section). `AccountService.deleteAccount` refuses while the caller holds the owner role, and while the account owns any live project (`owns_projects`) — transfer those first. The delete is soft: one statement marks the account and everything hanging off it (sessions, identities, overrides, push subscriptions, notifications, reports, memberships, subscription, invoices, enquiries) as deleted, the session stops resolving, and the email becomes free to register again — see database-conventions.md.

Self-serve UI lives on `Profile.tsx` at `/profile`, split into two route tabs (`RouteTabs`, same shape as `AdminWorkspace`):

- **Account** (`/profile`, `AccountSettings.tsx`) — rename, connected accounts, data export, account deletion, legal links. The provider list is a `tc-linked-providers-card` fed the union of configured (`AuthConfig.providers`) and linked providers, with per-provider icon/brand-colour maps in the module; its `tc-toggle` starts the link flow (`/api/auth/:provider?link=1`) or unlinks, refusing client-side when it is the only sign-in method left.
- **Devices** (`/profile/devices`, `DeviceSessions.tsx`) — every active session, current device first, sign out any other.

Billing is its own page at `/billing` (`BillingPage`), reached from the **Billing** entry in the user panel menu (`UserPanel.tsx`, shown only when the `billing` flag is on). See subscriptions-and-billing.md.

`/account` redirects to `/profile`, and `/profile/billing` redirects to `/billing`.

## Settings & overview

- `GET` (`admin.settings.read`) / `PUT` (`admin.feature.write`) `/api/settings/features` — the workspace product flags (`FeatureFlags`). Rendered as the *Feature flags* section of `/admin/settings` (`FeatureFlagsPanel`, one `tc-toggle-card` per flag); see subscriptions-and-billing.md.
- `GET` (`admin.settings.read`) / `PUT` (`admin.settings.write`) `/api/settings` — `PlatformSettings`: `signupsOpen` (boolean), `announcement` (string) and `salesContact` (string — the email or URL shown to accounts that must contact sales for a manual plan). These are examples of the two settings SHAPES; the settings table is a generic key/value store (`SettingsService`) that also holds the slot bindings and the push VAPID keys.
- `GET /api/admin/overview` (`admin.overview.read`) — live counts (`AdminOverviewService`): signups, WAU, D30 retention, project and build totals, open-report count, plus the chart series the overview tab renders (weekly sign-ups over 12 weeks, projects by application type, builds by status, accounts by role) — all derived live, no stored counters.

Every consequential admin write lands in the audit log (`recordAudit`).
