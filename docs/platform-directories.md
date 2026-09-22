# Platform directories

Two staff-only screens that read across every account, sitting in the **Platform** nav section next to
Realms, Invoices, Sales enquiries and Email. They are read-and-triage surfaces: neither one introduces a
new way to mutate a project or an account, they reuse the mutations that already exist.

| Screen | Route | Read permission |
| --- | --- | --- |
| All projects | `/platform/projects`, `/platform/projects/:id`, `/platform/projects/:id/:tab` | `admin.project.read` |
| User profiles | `/platform/users`, `/platform/users/:id`, `/platform/users/:id/:tab` | `admin.user.read` |

Both routes render one page component (`PlatformProjectsPage`, `PlatformUsersPage`) that branches on the
`:id` route param — list module when absent, detail module when present. Each page is wrapped in
`AuthGuard secured permission=…`, so a caller without the read key never reaches the module.

**The page-level `tc-rich-page-header` renders on the list view only.** A detail view is about one record,
so the detail module supplies its own header naming that record; showing the generic *All projects* /
*User profiles* header above it would put two competing titles on one screen.

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
- `GET /api/admin/projects/:id/members` (`admin.project.read`) → `AdminProjectMember[]`; 404
  `project_not_found`. This is the **staff** read of a project's roster. The project-plane route
  (`GET /api/projects/:id/members`) is unreachable here by design — `projectAuth` 404s a non-member — so
  without this endpoint the all-projects screen could show a member *count* and never say who they were.
  `ProjectService.listAdminMembers` reads `select-admin-members.sql` (membership joined to `users` and to
  `projects` for the owner comparison, owner sorted first then by email) and resolves each row's platform
  role name through `AccessPolicyService.listRoles`. `AdminProjectMember` deliberately spans **both**
  permission planes in one row: `roleId`/`roleName` are the platform role, `permissions`/`isOwner` are the
  project plane. Nothing here can mutate a membership; the staff view is read-only.

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
**count** and the newest `last_seen_at`, every project the account is a member of, summed storage bytes
across owned projects, and the 20 newest audit entries where the account was the actor.

**`AdminUserProfile.projects` carries full `AdminProject` rows** — `AdminUserProject` is now an alias of
`AdminProject`, not a reduced shape of its own. It used to be a four-field summary (name, icon, owner flag,
member count), which meant the profile could only ever render a thin list while the all-projects directory
rendered a full table of the same records. `select-projects-for-member.sql` now carries the same joins and
subqueries as `select-admin-projects.sql` (owner name/email, realm name, member/asset/build counts, summed
storage, the migration lock count), so `UserService.profile` maps straight through `toAdminProject` and one
row renderer serves both screens. The per-user *owner* flag is not a column — the client compares
`project.ownerId` to the profiled user.

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

## Screen shape

Both directories are **the table itself, on the page** — no wrapping `tc-section-card`, no title and
subtitle repeated inside it. The page header above already says what the list is; a card around a
full-width table only adds a frame and a second heading.

One typographic rule runs through all four screens and is worth keeping when extending them: **anything the
machine assigns is set in mono** — project ids, emails, realm names, byte counts, dates, counts — and
anything a person wrote (a project name, a display name, a description) is set in the UI sans. It gives the
reader a way to tell an identifier from a label without reading either.

The second rule is **pills for categories, dots for binary state**. A role, an app type, *Archived* and
*Migrating* are badges; active/inactive is a small coloured dot with its word beside it. Before this the
directory put two pills on every row and the eye could not tell which one carried the alarm.

### One row renderer, five tables

`helpers/platformTables.ts` owns every row and column on these screens, as HTML-string builders keyed by
column name (`tc-advanced-table` takes its rows as a trusted HTML string — see frontend-architecture.md).
Two entities, two functions each, plus `PROJECT_SORTABLE` so every project table sorts the same columns
(the six `ADMIN_PROJECT_SORTS` the server understands — `builds` is displayed but not sortable):

| | Column vocabulary | Used by |
| --- | --- | --- |
| `projectColumns` / `projectRow` | `name owner standing type realm members assets builds storage created actions` | all-projects directory, a user's Projects tab, a realm's Hosted projects panel |
| `personColumns` / `personRow` | `name email role standing status joined actions` | user directory, a project's Members tab |

A caller passes the **subset and order** of column keys it wants, so every table is the same table minus
the one thing its context already knows:

| Screen | Drops | Adds |
| --- | --- | --- |
| `/platform/projects` | — | — |
| `/platform/users/:id/projects` | `owner` (it is whose page you are on) | `standing` |
| `/platform/realms/:id` | `realm` (it is which realm you are on) | — |

Nothing is re-implemented per screen: add a column once and every table can take it. That is also the rule
for the next one — reach for the helper before hand-rolling a `<tr>`.

`projectRow` leads with the project's **own icon in its own colour** — a `.project-icon-tile` at
`data-size="xs"`, the identical tile the wizard, preview and switcher use, so a project looks the same
wherever it appears. (It replaced a bare colour swatch, which carried the colour but not the glyph.) The
tile is emitted as markup rather than React, so it renders `<tc-icon>` inside the row string; the element
upgrades when the table writes its `rows` innerHTML. Then come the archived/migrating flags, the owner as
name over email, the type badge, the realm in mono (or a muted *Unassigned*), and the counts right-aligned
in tabular mono.

`personRow` renders an initials tile plus a link-styled name, the email in mono with a check mark when
`verified`, the platform role as a badge, status as a dot, joined in mono. A deactivated account's `<tr>`
carries `.platform-row--muted`.

**The two permission planes must not look alike in a row.** A project owner who is also a platform owner
would otherwise render two identical `OWNER` pills side by side in *In project* and *Access*. So the
project-plane `standing` cell is deliberately **not** a badge: it is a mono uppercase word (accent-coloured
for an owner) over a plain-language detail line — `OWNER / Full access`, `MEMBER / 4 permissions`. The pill
stays reserved for the platform role. Same information, no collision, and the mono treatment matches the
rule that machine-assigned facts are set in mono.

### `UserProfileAdmin`

A `tc-rich-page-header` (name as the title, email as `sub`, role / status / permission-count chips) whose
`actions` slot holds every mutation the caller is allowed — *All profiles*, *Manage access*,
*Activate*/*Deactivate*, *Sign in as*, *Full audit trail* — then page tabs over **Profile**,
**Projects (n)** and **Activity (n)**, each a real URL (`/platform/users/:id/:tab`) so a tab is linkable
and the back button works.

**Profile** opens on a `tc-metric-grid` — projects owned, projects joined, assets across all of them,
storage used — derived from the now-full project rows rather than fetched, then the identity facts and
**quota usage**. Usage is a meter row per resource: mono label, `used / limit` in tabular figures, and a
3px bar coloured on the same thresholds the realm cards use (≥60 % warning, at-limit danger). A resource
with no limit prints `n · Unlimited` and draws no bar at all, because an empty rail reads as a quota at
zero.

**Projects** is the all-projects table, scoped to this person. **Activity** is the audit log as a
timestamp / action / detail grid.

### `ProjectAdminDetail`

Header from the project's own icon and identity colour, chips for app type / archived / migrating, owner as
`sub`, description as the header description. Then page tabs over **Overview** and **Members (n)** at
`/platform/projects/:id/:tab`, mirroring the user profile.

**Overview** is the `tc-metric-grid` (members, assets, builds, storage) over two panels: **Placement**
(realm, transfer state, owner, owner email — the operational half) and **Record** (id, created, last
updated, plus archived-at when the project is archived — the archival half).

**Members** is the user directory table, scoped to this project, and is the reason
`GET /api/admin/projects/:id/members` exists. Clicking a row jumps to that person's profile, which lists
this project again — the two screens close the loop on each other.

## Web layering

Nothing here departs from the shape in frontend-architecture.md:

- Services: `ProjectService.listAdmin` / `.getAdmin` / `.listAdminMembers`, `UserService.fetchProfile`.
- Store: the projects slice owns `adminProjects`, `adminProjectsTotal`, `adminProjectsLoading`,
  `adminProjectFilters`, `adminProject`, `adminProjectMembers`, `adminProjectMembersLoading`; the users
  slice owns `userProfile` / `userProfileLoading`. `clearAdminProject` drops the members with the project so
  a stale roster cannot flash on the next one.
- Modules: `ProjectDirectory`, `ProjectAdminDetail`, `UserDirectory`, `UserProfileAdmin`; row and column
  builders in `helpers/platformTables.ts`. The shared row, fact, meter and log primitives
  (`.platform-identity`, `.platform-standing`, `.platform-facts`, `.platform-meters`, `.platform-log`,
  `.platform-mono`, `.platform-state`) live in `styles/modules/_platform-directory.scss` and are used by
  both slices — reach for one before inventing another per-module class.
- Copy: `strings.projectsAdmin`, `strings.userProfilesAdmin`, `strings.nav.platformProjects` /
  `.platformUsers`.
- Styles: `styles/modules/_platform-directory.scss`.

The project directory filters **server-side**: `onFilterChange` updates a ref, assigns `filterValues` on the
element synchronously, and calls the slice — debounced for the text field. Everything the element needs
(`columns`, `filters`, `sort`, `filterValues`, `rows`, `total`, `limit`, `offset`, `loading`) goes through
`useTc`, with the object/array props wrapped in `hooks/useStableValue` so an unchanged value never
re-assigns; the `useEffect` alongside it does one thing only — restore focus and caret to the search input
when the change came from typing.

Both halves of that are load-bearing and were each learned from a bug. Splitting the props between `useTc`
and an effect breaks any table whose element mounts on a later commit than its data
(known-problems/usetc-property-assignment.md, trap 3 — this is what emptied the realm detail's Hosted
projects panel). Dropping the focus restore silently eats every character typed after a response lands
(known-problems/filter-input-loses-focus.md).

The user directory filters client-side over the already-loaded `/api/users` list (the `UsersAdmin` pattern),
because that list is small and is loaded anyway.
