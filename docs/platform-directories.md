# Platform directories

Two staff-only screens that read across every account, sitting in the **Platform** nav section next to
Realms, Invoices, Sales enquiries and Email. They are read-and-triage surfaces: neither one introduces a
new way to mutate a project or an account, they reuse the mutations that already exist.

| Screen | Route | Read permission |
| --- | --- | --- |
| All projects | `/platform/projects`, `/platform/projects/:id` | `admin.project.read` |
| User profiles | `/platform/users`, `/platform/users/:id` | `admin.user.read` |

Both routes render one page component (`PlatformProjectsPage`, `PlatformUsersPage`) that branches on the
`:id` route param — list module when absent, detail module when present. Each page is wrapped in
`AuthGuard secured permission=…`, so a caller without the read key never reaches the module.

## All projects

`admin.project.read` was declared in `PERMISSIONS` long before anything used it; this screen is what it now
gates. Nothing else on the platform can list projects the caller is not a member of.

### API

- `GET /api/admin/projects` (`admin.project.read`) → `AdminProjectPage` (`{ projects, total }`). Querystring
  is `AdminProjectFilters`: `q` (matches project name, owner name, owner email), `appType`, `realmId`,
  `state` (`active` | `archived` | `all`), `sort` (`name` | `owner` | `members` | `assets` | `storage` |
  `created`), `direction`, `limit` (≤100), `offset`. Everything is validated by inline JSON Schema in
  `projectRouter.ts` and re-clamped in `ProjectService.listAdmin` — an out-of-vocabulary value falls back to
  the default rather than reaching SQL.
- `GET /api/admin/projects/:id` (`admin.project.read`) → one `AdminProject`; 404 `project_not_found`.

`AdminProject` is a different shape from `Project` on purpose: it carries the owner's name and email, the
realm name, a build count, summed storage bytes and a `locked` flag, and it carries **no** `permissions` /
`isOwner` fields — a staff viewer is not a project member and gets no project-plane rights from this call.

### SQL

`select-admin-projects.sql` / `count-admin-projects.sql` / `select-admin-project.sql` live next to
`ProjectRepository`. Filtering is done with `$n::text = ''` guards so one statement serves every filter
combination; ordering is a chain of `CASE WHEN $5 = … AND $6 = …` expressions with `p.created_at DESC` as the
final tiebreaker. `locked` comes from counting non-terminal `project_migrations` rows — the same predicate
the project lock uses (see realms-and-migrations.md), so a project mid-migration is flagged in the list.

### Actions

Row and detail actions are the ones the caller already holds elsewhere:

- **Move to realm** — only with `admin.project.move`; opens the existing `MODAL.MOVE_PROJECT` and posts to
  `POST /api/admin/projects/:id/move`. On success the list (or the detail) refetches.
- **View owner profile** — only with `admin.user.read`; jumps to `/platform/users/:ownerId`.

## User profiles

The admin tab at `/admin/users` (`UsersAdmin`) stays what it was — a fast table for changing role, access
and active state. This screen is the per-person view: everything the platform knows about one account on
one page, with the same mutations reachable from it.

### API

- `GET /api/users/:userId/profile` (`admin.user.read`) → `AdminUserProfile`; 404 `user_not_found`.

`UserService.profile` aggregates in one round of `Promise.all`: the role name (from `AccessPolicyService`),
the resolved permission set, resolved account limits and live usage, linked OAuth identities, a session
**count** and the newest `last_seen_at`, every project the account is a member of (owner flag, member count,
archived flag), summed storage bytes across owned projects, and the 20 newest audit entries where the account
was the actor.

Note what is deliberately absent: session rows themselves are not returned, only how many and when the newest
was last seen. IP addresses and user agents stay on the self-serve device screen (auth-and-sessions.md) — a
staff viewer gets the fact of the sessions, not their fingerprints.

`ProjectRepository.listForMember` and `ProjectRepository.sumOwnerBytes` back the project and storage parts.

### Actions

All gated separately, all reusing existing endpoints, and all hidden when the target is the caller:

- **Manage access** (`admin.user.role.write`) — `MODAL.MANAGE_ACCESS`, then `PATCH /api/users/:userId` plus
  the per-user override save; the profile refetches afterwards.
- **Activate / Deactivate** (`admin.user.role.write`) — `PATCH /api/users/:userId`.
- **Sign in as** (`admin.user.impersonate`) — `MODAL.IMPERSONATE_USER`, subject to the same last-owner and
  owner-target rules `UserService.impersonate` already enforces.
- **Full audit trail** (`audit.read`) — `/moderation/audit?actor=<id>`.
- **Open in project directory** (`admin.project.read`) — `/platform/projects/:projectId`.

## Web layering

Nothing here departs from the shape in frontend-architecture.md:

- Services: `ProjectService.listAdmin` / `.getAdmin`, `UserService.fetchProfile`.
- Store: the projects slice owns `adminProjects`, `adminProjectsTotal`, `adminProjectsLoading`,
  `adminProjectFilters`, `adminProject`; the users slice owns `userProfile` / `userProfileLoading`.
- Modules: `ProjectDirectory`, `ProjectAdminDetail`, `UserDirectory`, `UserProfileAdmin`.
- Copy: `strings.projectsAdmin`, `strings.userProfilesAdmin`, `strings.nav.platformProjects` /
  `.platformUsers`.
- Styles: `styles/modules/_platform-directory.scss`.

The project directory filters **server-side**: `onFilterChange` updates a ref, assigns `filterValues` on the
element synchronously, and calls the slice — debounced for the text field. `rows`/`total`/`limit`/`offset`/
`loading` are assigned in a `useEffect`, never as `useTc` props or JSX attributes, and the effect restores
focus and caret to the search input when the change came from typing. That is deliberate, not incidental:
see known-problems/filter-input-loses-focus.md, *The server-side variant* — without it every character typed
after a response lands is silently dropped.

The user directory filters client-side over the already-loaded `/api/users` list (the `UsersAdmin` pattern),
because that list is small and is loaded anyway.
