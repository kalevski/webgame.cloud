# Users, account & settings

## Key files

- API: `api/src/routers/userRouter.ts` (admin surface), `api/src/routers/accountRouter.ts` (self-serve), `api/src/services/{UserService,AccountService,AdminOverviewService,SettingsService}.ts`, `api/src/repositories/users/{UserRepository,SessionRepository}.ts`, `api/src/repositories/account/AccountRepository.ts`.
- Web: `web/src/services/UserService.ts`, `web/src/state/{users,auth}.slice.ts`, `web/src/modules/{UsersAdmin,AdminWorkspace,AdminOverview,PlatformSettingsPanel,Profile,AccountSettings,DeviceSessions}.tsx`, `web/src/modals/{CreateUserModal,ManageAccessModal,ConfirmImpersonateModal,ConfirmDeleteAccountModal}.tsx`.

## Admin user directory (`userRouter.ts` → `UserService`)

- `GET /api/users` (`admin.user.read`) — the directory.
- `POST /api/users` (`admin.user.role.write`) — pre-provision an account by email; claimed on first sign-in via the email match in `resolveUser`.
- `POST /api/users/:id/impersonate` (`admin.user.impersonate`) — swaps the admin's session for the target's, recording the administrator in `sessions.impersonated_by`. `POST /api/auth/impersonation/end` is the one-click way back; every action taken meanwhile is stamped `audit_log.impersonated`, and the consent gate is refused (auth-and-sessions.md). Never a ladder into an owner account.
- `PATCH /api/users/:id` (`admin.user.role.write`) — role / active / verified. Enforces two invariants: nobody edits their own access, and **the last active owner may never be demoted or deactivated** (`UserRepository.countActiveOwners`). Deactivating clears the user's sessions.

- `GET /api/users/:id/profile` (`admin.user.read`) — the per-account aggregate (`AdminUserProfile`) behind the *User profiles* platform screen: role name, resolved permissions, limits + live usage, linked identities, session count and newest `last_seen_at`, project memberships, owned storage bytes and the 20 newest audit entries for that actor. See platform-directories.md.

Per-account access (permission/limit overrides) is written through `ManageAccessModal` → `PUT /api/users/:id/access` (see access-and-feature-flags.md), not here.

The directory is humans only: every route above filters `kind = 'human'` and answers 404 for a service account (`user_not_found`, from `UserService.impersonate`/`update`). Machine identities live in their own tab under `/api/service-accounts` — see service-accounts.md.

## Self-serve account (`accountRouter.ts`)

`POST /api/account/consent`, `PUT /api/account/name` (the only field a user writes on their own row), `GET /api/account/export` (every row they own, as JSON — including linked identities), `DELETE /api/account`, `GET /api/account/identities` + `DELETE /api/account/identities/:provider` (connected OAuth logins — see the auth doc's *Linked identities* section for the rules), `GET /api/account/sessions` + `DELETE /api/account/sessions/:id` (active devices — see the auth doc's *Active devices* section). `AccountService.deleteAccount` refuses while the caller holds the owner role, and while the account owns any live project (`owns_projects`) — transfer those first. The delete is soft: one statement marks the account and everything hanging off it (sessions, identities, overrides, push subscriptions, notifications, reports, memberships, subscription, invoices, enquiries) as deleted, the session stops resolving, and the email becomes free to register again — see database-conventions.md.

Self-serve UI lives on `Profile.tsx` at `/profile`, split into two route tabs (`RouteTabs`, same shape as `AdminWorkspace`):

- **Account** (`/profile`, `AccountSettings.tsx`) — rename, connected accounts, data export, account deletion, legal links. The display-name field carries its hint as `tc-helper-text` and commits through the floating action bar (`FloatingActionBar`, `visible={dirty}`) rather than a button under the input, the same commit surface as project settings — the bar measures the form column, so it sits under the identity column and not across the page. The provider list is a `tc-linked-providers-card` fed the union of configured (`AuthConfig.providers`) and linked providers, with per-provider icon/brand-colour maps in the module; its `tc-toggle` starts the link flow (`/api/auth/:provider?link=1`) or unlinks, refusing client-side when it is the only sign-in method left.
- **Devices** (`/profile/devices`, `DeviceSessions.tsx`) — every active session, current device first, sign out any other.

Billing is its own page at `/billing` (`BillingPage`), reached from the **Billing** entry in the user panel menu (`UserPanel.tsx`, shown only when the `billing` flag is on). See subscriptions-and-billing.md.

`/account` redirects to `/profile`, and `/profile/billing` redirects to `/billing`.

## Settings & overview

- `GET` (`admin.settings.read`) / `PUT` (`admin.feature.write`) `/api/settings/features` — the workspace product flags (`FeatureFlags`). Rendered as the *Feature flags* section of `/admin/settings` (`FeatureFlagsPanel`, one `tc-toggle-card` per flag); see subscriptions-and-billing.md.
- `GET` (`admin.settings.read`) / `PUT` (`admin.settings.write`) `/api/settings` — `PlatformSettings`: `signupsOpen` (boolean), `announcement` (string) and `salesContact` (string — the email or URL shown to accounts that must contact sales for a manual plan). These are examples of the two settings SHAPES; the settings table is a generic key/value store (`SettingsService`) that also holds the slot bindings and the push VAPID keys. `PlatformSettingsPanel` saves through the floating action bar gated on a `dirty` flag its field handlers set, so the toggle/textarea/input read as a form with one commit rather than three independent controls; the flag clears when the store re-seeds the panel and when the save resolves.
- `GET /api/admin/overview` (`admin.overview.read`) — live counts (`AdminOverviewService` over `repositories/admin/AdminOverviewRepository.ts`): signups, WAU, D30 retention, project and build totals, open-report count, plus the chart series the overview tab renders (weekly sign-ups over 12 weeks, projects by application type, builds by status, accounts by role) — all derived live, no stored counters.

  Every aggregate filters `deleted_at IS NULL`, and the sign-up counts filter `kind = 'human'` so service accounts are not counted as sign-ups. The SQL lives in `repositories/admin/sql/` rather than inline in the service, which is the reason it is right: the `deleted_at` convention is enforced at the repository layer, and the counts previously drifted from the live totals precisely because they sat outside it (database-conventions.md).

Every consequential admin write lands in the audit log (`recordAudit`).
