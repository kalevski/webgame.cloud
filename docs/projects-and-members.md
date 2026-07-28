# Projects, members and per-project permissions

A **project** is the workspace for one game. Any account holding the platform permission `project.create`
can create one; the creator becomes its **resource owner** (`projects.owner_id` — not `OWNER_ROLE_ID`).

## Two permission planes

| Plane | Lives in | Resolved by | Example keys |
| --- | --- | --- | --- |
| Platform | `PERMISSIONS` (`contracts/permissions.ts`), granted by roles + per-user deltas | `resolvePermissions` (`domain/access.ts`), `request.can(...)` | `project.create`, `realm.write`, `admin.project.move` |
| Project | `PROJECT_PERMISSIONS` (`contracts/projectAccess.ts`), stored as `project_members.permissions` (`text[]`) | `resolveProjectPermissions` (`domain/projectAccess.ts`), `request.canInProject(...)` | `member.manage`, `file.write`, `build.run`, `config.write` |

Project permissions are row data, never role grants — they must not enter `PERMISSIONS`, the admin role
editor or `SEED_ROLES`. `contracts/projectAccess.ts` holds a compile-time guard (`PLANES_ARE_DISJOINT`)
that fails the build if a key ever appears in both.

## Request guards (`api/src/projectAuth.ts`)

`loadProject`, `requireProjectMember`, `requireProjectPermission(...)` and `requireProjectOwner` decorate
the request with `request.project`, `request.projectPermissions` and `request.canInProject(key)`, and
enforce this order on every project-scoped route:

1. Not a member → **404** `project_not_found`. Never 403 — a non-member cannot probe for existence.
2. Member without the permission → **403** `forbidden`.
3. Mutating method while `archived_at` is set → **409** `project_archived`.
4. Mutating method while a non-terminal `project_migrations` row exists → **423** `project_locked`.
5. The project owner implicitly holds every project permission; so does the platform `OWNER_ROLE_ID`
   account (support access).

API-key-authenticated requests are rejected outright (`403`) on project routes: keys carry platform
scopes only, and the project plane has no representation for them yet.

## Creating a project

`ProjectService.create` runs one `Database.transaction`: quota check (`assertWithinLimit(user, 'projects')`)
→ realm selection (`RealmService.requireRealm`, 503 `realm_unavailable` rolls the whole thing back) →
insert project → insert the owner's member row with the full permission array → insert the three
vocabularies (categories, tags, build tags). At least one category is required (`category_required`).
`POST /api/projects` honours `Idempotency-Key`.

## Members and invitations

- `GET/PATCH/DELETE /api/projects/:id/members[/:memberId]` — roster management behind `member.manage`.
- `DELETE /api/projects/:id/members/me` — any member except the owner can leave.
- `POST /api/projects/:id/invites` — an invite carries the exact permission set it will materialise. A
  member can never grant a permission they do not hold (`permission_escalation`). Team size is charged to
  the project owner (`members_per_project`, counting members **and** pending invites).
- Delivery: an in-app `project_invite` notification when the address matches an account, otherwise the
  seeded `project-invitation` email template. With the `email` flag off and no matching account the invite
  is refused (`invite_undeliverable`) rather than written.
- `POST /api/invites/:id/accept` verifies the session's email matches the invite (or its `user_id`),
  otherwise `invite_email_mismatch` — without that check the invite id is a bearer token to the project.
  Invites expire after 7 days.
- UI: *Invite* is the `MembersPage` header action (gated on `member.manage`), the roster and the pending
  invites are two tabs of one card, and removal is a captioned `.member-remove` strip under the roster
  rather than a red button per row.

## Vocabularies

Three flat, project-scoped lists: `asset_categories`, `project_tags`, `project_build_tags`. `PUT
/api/projects/:id/vocabularies` replaces all three. Removing a name that is still referenced (by an
asset's tags, a bundle rule, a build tag or a config version) is refused with `tag_in_use` and the
reference count. Renaming is not supported — remove and re-add.

## Ownership, archive, delete

- **Transfer** checks both the recipient's project quota and their storage headroom (storage follows
  `owner_id`), then repoints the row and drops the old owner's membership.
- **Archive** makes the project read-only (409 on every write) and keeps it listed under `?archived=true`.
- **Delete** is one data-modifying CTE soft-deleting the project and every child, then enqueues
  `realm.purge` for the asset bytes.
- An account that owns a live project cannot be hard-deleted (`owns_projects`) — transfer first.


## The active project and the switcher

There is no projects **list** screen. Every project-scoped surface hangs off one **active project**,
chosen from a `tc-extended-select` that sits in the dashboard layout's `sidebar-menu` slot, directly
above `SidebarMenu` (`modules/ProjectSwitcher.tsx`).

- One entry per project the caller is a member of — name plus description, searchable.
- A trailing **Create new project** entry that opens the three-step wizard
  (`MODAL.CREATE_PROJECT`). It is **appended only while `projects.used < limit`** — at the plan
  ceiling it is removed, not disabled, so there is no dead control to click.
- Selecting a project sets `activeProjectId`, persists it to local storage, drops the lock poll, and
  navigates to the same tab under the new id.
- `/projects` is a redirect: it sends the caller to `/projects/<active>/assets`, or renders the
  onboarding card when they have none (`modules/ActiveProjectRedirect.tsx`).

The sidebar nav below the switcher carries two sections. **Project** holds Dashboard, Settings and
Members — where you look after the project itself — and **Workspace** holds the asset pipeline in the
order it runs: Assets, Bundles, Builds, Configs (plus Realms for staff who hold `realm.read`). With no
active project the Project section collapses to Dashboard alone and the Workspace section disappears
entirely rather than rendering an empty heading.

## Working with tc-* lists

`tc-action-row-list` fires `tc-action-click` on its **row button only** — it has no row-click event,
and its `onActionClick` JS property is not invoked by a real user click. Console modules therefore
bind the DOM event through `hooks/useTcEvent.ts`, and each row's single button carries the row's
*primary* intent (Open / Details / Edit / Run build). Destructive actions get their own buttons
beneath the list rather than competing for that slot.
