# Projects, members and per-project permissions

> Source: `proposal/01-projects-and-permissions.md`. Shared decisions: [`README.md`](README.md).
> Depends on 07 (quotas) and 05 (realm selection).

## Requirement

A project is the workspace for one game. Any account holding the platform permission `project.create`
can create one, and the creator becomes its **resource owner** (`projects.owner_id` — not
`OWNER_ROLE_ID`). Creation runs a three-step wizard, is quota-checked against the creator's plan,
pins the project to a realm, seeds the three project vocabularies, and inserts the owner as a member —
all in one transaction. Inside a project there are **no roles**: membership grants read of everything,
and each of six per-project permissions grants writes in one area. Invitations carry the permission set
they will materialise, and a member can never grant a permission they do not hold. Team size is a
billing quota charged to the project owner.

## Scope

- `projects` rewritten; `project_members`, `project_invites`, `file_categories`, `project_tags`,
  `project_build_tags`.
- The project permission plane (D2) and the request guards (D3).
- Create-project wizard, project switcher with `activeProjectId` persistence, members screen with
  roster/invites tabs, invite + edit-permission + remove modals.
- Project settings: rename, description, the three vocabularies, default upload category, archive,
  transfer ownership, delete — the last three type-to-confirm.
- Leaving a project (`DELETE /api/projects/:id/members/me`) — a member must be able to walk away from
  someone else's workspace without asking its owner.
- Invite delivery: in-app notification when the address matches an account, `project-invitation` email
  otherwise; 7-day expiry; revoke.

## Non-goals

- No per-project roles, no permission templates, no groups. The proposal rejects them explicitly.
- No cross-project permission ("can edit files everywhere"). A permission without a project is
  meaningless.
- No seat billing beyond the `members_per_project` ceiling from spec 07.
- Tasks are deleted (D1), not migrated.

## Data model

`00001_schema.sql` — `projects` rewritten in place:

```sql
CREATE TABLE projects (
    id                  text PRIMARY KEY,
    owner_id            text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    realm_id            text REFERENCES realms(id) ON DELETE RESTRICT,
    name                text NOT NULL,
    description         text NOT NULL DEFAULT '',
    app_type            text NOT NULL DEFAULT 'game' CHECK (app_type IN ('game', 'app', 'prototype')),
    icon                text NOT NULL DEFAULT 'Gamepad2',
    color               text NOT NULL DEFAULT '',
    default_category_id text,
    archived_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);
CREATE INDEX projects_owner_idx ON projects (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX projects_realm_idx ON projects (realm_id) WHERE deleted_at IS NULL;

CREATE TABLE project_members (
    id          text PRIMARY KEY,
    project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions text[] NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE UNIQUE INDEX project_members_unique_idx ON project_members (project_id, user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX project_members_user_idx ON project_members (user_id) WHERE deleted_at IS NULL;

CREATE TABLE project_invites (
    id          text PRIMARY KEY,
    project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email       text NOT NULL DEFAULT '',
    user_id     text REFERENCES users(id) ON DELETE CASCADE,
    permissions text[] NOT NULL DEFAULT '{}',
    invited_by  text REFERENCES users(id) ON DELETE SET NULL,
    expires_at  timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE UNIQUE INDEX project_invites_pending_idx ON project_invites (project_id, lower(email))
    WHERE accepted_at IS NULL AND deleted_at IS NULL;
CREATE INDEX project_invites_user_idx ON project_invites (user_id) WHERE deleted_at IS NULL;

CREATE TABLE file_categories (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    position   integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX file_categories_name_idx ON file_categories (project_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE TABLE project_tags (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    ... same three timestamps
);
CREATE UNIQUE INDEX project_tags_name_idx ON project_tags (project_id, lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE project_build_tags (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    ... same three timestamps
);
CREATE UNIQUE INDEX project_build_tags_name_idx ON project_build_tags (project_id, lower(name)) WHERE deleted_at IS NULL;
```

`default_category_id` carries no FK on purpose — the category is soft-deletable and a dangling id
resolves to *Uncategorized*, which is the desired behaviour rather than a constraint violation.

`tasks` is dropped from the Up block, from the Down block, and from the seed.

**Delete cascade is manual.** `delete-project.sql` is one data-modifying CTE soft-deleting the project
plus its members, invites, categories, tags, build tags, assets, bundles, builds, build files, configs,
schemas and config versions, returning `count(*)::int AS c`. The service then enqueues `realm.purge`
(D7) with the deleted assets' storage paths — rows and bytes go together, or the realm fills up with
data nobody can see.

`TABLE_LABELS` in `contracts/retention.ts` gains `project_members`, `project_invites`,
`file_categories`, `project_tags`, `project_build_tags`; all keep the `0` (keep forever) default (D10).

Rebuild: `dropdb starter && npm run migrate`.

## Contracts

New `contracts/projectAccess.ts` (the second permission plane):

```ts
export const PROJECT_PERMISSIONS = [
    'member.manage', 'project.settings', 'file.write', 'bundle.write', 'build.run', 'config.write',
] as const
export type ProjectPermission = typeof PROJECT_PERMISSIONS[number]

export const PROJECT_PERMISSION_LABELS: Record<ProjectPermission, string> = { … }
export const PROJECT_PERMISSION_HINTS: Record<ProjectPermission, string> = { … }   // one line each, for the invite cards
```

`contracts/projects.ts` rewritten:

```ts
export type Project = {
    id: string; ownerId: string; realmId: string | null
    name: string; description: string; appType: AppType
    icon: string; color: string
    defaultCategoryId: string | null
    archivedAt: string | null
    memberCount: number; fileCount: number
    permissions: ProjectPermission[]      // the CALLER's resolved set, server-computed
    isOwner: boolean
    createdAt: string; updatedAt: string
}
export type ProjectDraft = {
    name: string; description?: string; appType?: AppType; icon?: string; color?: string
    categories?: string[]; tags?: string[]; buildTags?: string[]
}
export type ProjectMember = { id: string; userId: string; name: string; email: string; avatarUrl: string; permissions: ProjectPermission[]; isOwner: boolean; createdAt: string }
export type ProjectInvite = { id: string; email: string; userId: string | null; permissions: ProjectPermission[]; invitedBy: string; expiresAt: string; createdAt: string }
export type InviteDraft = { email?: string; username?: string; permissions: ProjectPermission[] }
export type ProjectVocabularies = { categories: NamedRow[]; tags: NamedRow[]; buildTags: NamedRow[] }
```

`Task`/`TaskDraft`/`TaskStatus` are deleted.

`contracts/errors.ts` adds `project_locked` (from 05), `project_archived`, `member_not_found`,
`member_exists`, `invite_not_found`, `invite_expired`, `invite_exists`, `permission_escalation`,
`owner_cannot_be_removed`, `category_required`, `username_not_found`, `not_project_owner`,
`invite_email_mismatch`, `tag_in_use`, `owns_projects` (D13), `invite_undeliverable`.

`app_type` is presentational — it picks the wizard's default icon and nothing branches on it. It stays
a column rather than a client-side label so a later feature (engine defaults, template projects) has
somewhere to hang; nothing else may read it until then.

`contracts/notifications.ts`: `project_invite` kind (CHECK in lockstep). `task_activity` and
`project_shared` are removed with the example.

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/projects` | `requireAuth` | `?archived=bool` | — |
| POST | `/api/projects` | `requirePermission('project.create')` | `projectSchema` | `name_required`, `category_required`, `limit_reached`, `realm_unavailable` |
| GET | `/api/projects/:id` | `requireProjectMember` | — | `project_not_found` |
| PATCH | `/api/projects/:id` | `requireProjectPermission('project.settings')` | `{ ...projectSchema, required: [] }` | `project_not_found`, `forbidden`, `project_locked` |
| POST | `/api/projects/:id/archive` | owner only | `{ archived: boolean }` | `not_project_owner` |
| POST | `/api/projects/:id/transfer` | owner only | `{ userId }` | `user_not_found`, `not_project_owner`, `limit_reached` |
| DELETE | `/api/projects/:id` | owner only | — | `not_project_owner`, `project_locked` |
| GET | `/api/projects/:id/vocabularies` | `requireProjectMember` | — | `project_not_found` |
| PUT | `/api/projects/:id/vocabularies` | `requireProjectPermission('project.settings')` | `{ categories[], tags[], buildTags[], defaultCategoryId }` | `category_required` |
| GET | `/api/projects/:id/members` | `requireProjectMember` | — | `project_not_found` |
| PATCH | `/api/projects/:id/members/:memberId` | `requireProjectPermission('member.manage')` | `{ permissions }` | `member_not_found`, `permission_escalation`, `owner_cannot_be_removed` |
| DELETE | `/api/projects/:id/members/:memberId` | `requireProjectPermission('member.manage')` | — | `member_not_found`, `owner_cannot_be_removed` |
| DELETE | `/api/projects/:id/members/me` | `requireProjectMember` | — | `owner_cannot_be_removed` |
| GET | `/api/projects/:id/invites` | `requireProjectMember` | — | `project_not_found` |
| POST | `/api/projects/:id/invites` | `requireProjectPermission('member.manage')` | `inviteSchema` | `username_not_found`, `invite_exists`, `member_exists`, `permission_escalation`, `limit_reached` |
| DELETE | `/api/projects/:id/invites/:inviteId` | `requireProjectPermission('member.manage')` | — | `invite_not_found` |
| POST | `/api/invites/:inviteId/accept` | `requireAuth` | — | `invite_not_found`, `invite_expired`, `limit_reached` |
| POST | `/api/invites/:inviteId/decline` | `requireAuth` | — | `invite_not_found` |

Invite accept/decline are addressed top-level (the invitee is not yet a member, so the project-scoped
guard cannot run).

`ProjectService`

- `create(user, draft)` — **one `Database.transaction`**, in this order: `assertWithinLimit(user, 'projects')`
  → `realms.selectRealm(user.id, trx)` (undefined → `UnavailableError('realm_unavailable')`, which
  throws and therefore rolls back) → insert project → insert the owner's `project_members` row **with
  the full `PROJECT_PERMISSIONS` array written into the column** (the computed owner bypass stays, but
  the roster and any future direct read then agree with it) → insert categories/tags/build tags.
  Remember: inside the callback a `return` COMMITs; only a throw rolls back. The route accepts
  `Idempotency-Key` (D12) — a double-submitted wizard must not charge the project quota twice. No
  starter assets ship in v1: seeding them would make project creation depend on a reachable realm for
  more than row-writing, and the empty state teaches the upload flow better than a folder of somebody
  else's art.
- `invite(actor, project, draft)` — resolves `username` → user (miss = `NotFoundError('username_not_found')`,
  nothing written) or takes `email` as-is; refuses any permission the actor does not hold
  (`ValidationError('permission_escalation')`, owner exempt); `assertWithinProjectLimit(project, 'members_per_project')`
  counting members + pending invites; then either `notify(user.id, 'project_invite', …)` or enqueues the
  `project-invitation` email template (seeded in `00002_seed.sql` — `email_templates` is a runtime
  table and the template must exist before the first invite). `expires_at = now() + 7 days`. When the
  address matches no account **and** the `email` product flag is off, the invite is refused with
  `invite_undeliverable` rather than written — an invite nobody can receive is a row that only ever
  confuses its author.
- `acceptInvite(user, inviteId)` — transaction: **the session's email must match the invite's**
  (case-insensitively) unless the invite carries a `user_id` matching the caller; otherwise
  `invite_email_mismatch`. Without that check the invite id is a bearer token to someone else's
  project. Then re-check expiry and the member quota, insert the membership with the invite's
  `permissions` verbatim, soft-delete the invite.
- `leave(user, project)` — soft-deletes the caller's own membership. The owner gets
  `owner_cannot_be_removed` and is pointed at transfer or delete.
- `transferOwnership(owner, project, toUserId)` — transaction: `assertWithinLimit(newOwner, 'projects')`
  **and `assertStorageHeadroom(newOwnerId, projectBytes)`** — storage is charged to `projects.owner_id`,
  so a transfer moves potentially gigabytes onto the recipient's plan; a `blocked` verdict refuses the
  transfer, `grace` allows it and flags. Then repoint `owner_id`, ensure the new owner has a member row
  carrying the full permission array, remove the old owner's membership.
- `replaceVocabularies(project, draft)` — a name that disappears from `tags` or `buildTags` while
  anything still references it (`assets.tags`, `bundles.included_tags`/`excluded_tags`/`build_tag`,
  `builds.build_tag`, `config_versions.build_tag`) is refused with `tag_in_use` plus the reference
  count. Silent removal would orphan bundle rules and config versions into strings nothing resolves.
  Renaming is not supported in v1 — remove and re-add.
- `remove`/`delete` — the CTE above, then a `realm.purge` job for the project's asset paths (D7);
  deleting the active project also returns `{ deleted: true }` so the client can clear
  `activeProjectId`.
- **Archive is enforced, not cosmetic.** `archived_at` blocks every mutating project route with
  `409 project_archived` from the same preHandler that raises the 423 lock (D3), and the project stays
  listed under `?archived=true`. Un-archiving is the owner-only inverse of the same call.
- `AccountService`'s hard delete refuses while the account owns any live project (`owns_projects`,
  D13), naming the count and pointing at *Transfer ownership*.

`ProjectRepository` (BaseRepository): `listForUser(userId)` (join `project_members`, `deleted_at IS NULL`
on both sides), `findByIdForUser(id, userId)` returning the row **plus the caller's permissions** so the
guard needs one query, `create`/`update`/`softDeleteCascade`, `countMembers`. `MemberRepository` and
`InviteRepository` return `Result<Row, 'exists'>` sentinels on the two partial unique indexes; both
literals re-exported from `conflicts.ts`.

`domain/projectAccess.ts`:

```ts
export const resolveProjectPermissions = (user, project, membership) : Set<ProjectPermission> =>
    project.ownerId === user.id || user.role === OWNER_ROLE_ID
        ? new Set(PROJECT_PERMISSIONS)
        : new Set(membership?.permissions ?? [])
```

This is the ONLY place project permissions are read — grepping `permissions.includes(` outside it
should find nothing.

Side effects (all fire-and-forget): audit `project.created`, `project.updated`, `project.archived`,
`project.transferred`, `project.deleted`, `member.invited`, `member.joined`, `member.permissions_changed`,
`member.removed`, `invite.revoked`. Notification `project_invite` to an existing account.

## Web

- `state/projects.slice.ts` — `projects`, `activeProjectId`, `activeProject`, `members`, `invites`,
  `vocabularies`, `lock` (spec 05), plus `setActiveProject(id)`, `fetchProjects`, `createProject`,
  `updateProject`, `archiveProject`, `transferProject`, `deleteProject`, `fetchMembers`,
  `updateMemberPermissions`, `removeMember`, `fetchInvites`, `sendInvite`, `revokeInvite`,
  `acceptInvite`, `declineInvite`. Create/delete/transfer call `void get().refreshSession()` — they
  move the project quota.
- **Active project resolution** (`setActiveProject` + a `resolveActiveProject` helper): read
  `localStorage.activeProjectId`; keep it if it still matches a visible project; otherwise take the
  first project and rewrite the key; with no projects leave it null and let the dashboard render the
  onboarding path. Deleting the active project clears the key inside the same action, and switching
  drops the lock poll before the new project's poll starts.
- `hooks/useProjectCan.ts` — `useProjectCan(permission)` reading `activeProject.permissions`; the
  console's equivalent of `useCan`. Read and write are gated separately on every screen: the page
  renders for any member, each write control is dropped (not disabled) without its permission.
- Modals: `MODAL.CREATE_PROJECT` (wizard), `MODAL.INVITE_MEMBER`, `MODAL.EDIT_MEMBER_PERMISSIONS`,
  `MODAL.REMOVE_MEMBER`, `MODAL.TRANSFER_PROJECT`, `MODAL.DELETE_PROJECT`, `MODAL.ARCHIVE_PROJECT`.
  The last three are type-to-confirm — the confirm button stays disabled until the typed value equals
  the project name exactly (`helpers/validation.ts`).
- Strings: a `projects` section (wizard copy verbatim from the proposal, including
  *"Choose a name that captures the essence of your project. You can always change it later!"*),
  a `members` section, and `t.validation` entries.
- Quota UI: the switcher's **Create new** entry is appended only while `projects.used < limit` —
  removed, never disabled. Invite is wrapped in `useLimitLock(membersReached, PROJECT_LIMIT_ENTITLEMENT)`,
  and on a plan whose `members_per_project` is 1 the members screen says *"Your plan is single-seat —
  upgrade to invite teammates."* instead of rendering an empty roster behind a dead button.
- An archived project renders read-only with a `tc-banner` and no write controls at all — the same
  treatment as the migration lock, different copy.
- **Leave project** sits in the members screen's own row for the current user (not in settings, which
  is owner-shaped), confirmed through `MODAL.LEAVE_PROJECT`.
- `modules/CommandPalette.tsx` is rebuilt for the console (D1): jump to project, jump to Files /
  Bundles / Builds / Configs of the active project, upload assets, run the last bundle's build. Its
  `task.write` entries go with the example.
- Routes: `/projects/:id` (overview), `/projects/:id/members`, `/projects/:id/settings`; sidebar
  switcher above the nav, tinted by `activeProject.color`.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Project switcher | `tc-dropdown` | `specs/tc-dropdown.md` | One entry per project (name, description, icon) + trailing **Create new** |
| Wizard shell | `tc-modal` + `tc-stepper` | `specs/tc-modal.md`, `specs/tc-stepper.md` | `steps` JS prop (`{key,label,description}`), `active-step` attribute; footer buttons are **direct children** of the modal |
| Name / description | `tc-form-input` | `specs/tc-form-input.md` | `required`; placeholder suggests a name |
| Application type | `tc-card-options` | `specs/tc-card-options.md` | `options` JS prop, `value` attribute, `tc-change` → `{key}`; first type preselected |
| Icon / colour | `tc-icon-picker`, `tc-color-picker` | `specs/tc-icon-picker.md`, `specs/tc-color-picker.md` | `tc-change` |
| Three vocabularies | `tc-tag-input` ×3 | `specs/tc-tag-input.md` | `recommendations` + `value` JS props, `allow-create`, `tc-change` → `{ value: string[] }`. **Next is disabled until categories is non-empty** |
| Review step | `tc-badge-row` | `specs/tc-badge-row.md` | `badges` JS prop — the collected configuration as key/value chips |
| Members header + Invite | `tc-action-header` | `specs/tc-action-header.md` | `actions` JS prop; the `invite` entry present only with `member.manage`; `tc-exec` → `{key}` |
| Roster / invites tabs | `tc-tab-bar` | `specs/tc-tab-bar.md` | `tabs` JS prop — `Members (n)` / `Invites (n)` |
| Roster rows | `tc-data-list` | `specs/tc-data-list.md` | `items` + `renderRow`; delegated `tc-action` → `{action, id}` |
| Member identity | `tc-avatar` | `specs/tc-avatar.md` | Image or derived initials |
| Granted permissions | `tc-badge-row` | `specs/tc-badge-row.md` | One chip per permission — no truncation games |
| Row actions | `tc-action-items` | `specs/tc-action-items.md` | Kebab: *Edit permissions*, *Remove* — rendered only with `member.manage` |
| Invite permission picker | `tc-multi-card-select` | `specs/tc-multi-card-select.md` | `options` (label + `PROJECT_PERMISSION_HINTS` description) and `value` JS props, `tc-change` → `{ value: string[] }`. **Options are filtered to the inviter's own set**, never disabled |
| "No permissions = read-only" hint | `tc-alert` | `specs/tc-alert.md` | `variant="info"` — say it explicitly |
| Edit-permissions modal | `tc-checkbox-group` | `specs/tc-checkbox-group.md` | `options`/`value` JS props, `tc-change`; prefilled from the member's set |
| Empty roster / invites | `tc-empty-state` | `specs/tc-empty-state.md` | |
| Loading | `tc-skeleton` | `specs/tc-skeleton.md` | `variant="text"`, `count` |
| Danger zone | `tc-section-card` | `specs/tc-section-card.md` | `danger` variant; hosts archive / transfer / delete |
| Transfer search | `tc-extended-select` | `specs/tc-extended-select.md` | Debounced (150 ms built in); helper *"Enter at least 2 characters to search."* |

No new React component — the catalog covers every element.

## Access policy

Platform: `project.create` to create at all (default + paid roles); everything else on a project is
governed by the project plane.

| Project action | Permission |
| --- | --- |
| Read anything in the project | membership (implicit) |
| Invite / remove / re-permission members | `member.manage` |
| Edit name, description, vocabularies, default category | `project.settings` |
| Upload / rename / re-tag / delete files | `file.write` |
| Create / edit / delete bundles | `bundle.write` |
| Trigger builds, set build tags, delete/purge builds | `build.run` |
| Create / edit schemas, configs, versions | `config.write` |
| Archive, transfer ownership, delete the project | **owner only**, never grantable |
| Leave the project | any member except the owner |

Quota: `members_per_project` (spec 07), counted including the owner and pending invites, charged to
`projects.owner_id`.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `projects` rewrite + five tables + Down order, `tasks`
dropped), `sql/00002_seed.sql` (E: drop `task.write`/`project.share`/`project.export` grants, add
`project.create`).

**api** — `contracts/projectAccess.ts` (C) + `contracts/index.ts` (E), `contracts/projects.ts` (E,
rewrite), `contracts/permissions.ts` (E), `contracts/errors.ts` (E), `contracts/notifications.ts` (E),
`schema/projects.ts` (E: new row types, `TaskRow` deleted),
`repositories/projects/sql/*.sql` (C/E: select-project, select-projects-for-user, insert-project,
update-project, delete-project (CTE), select-members, insert-member, update-member, delete-member,
select-invites, insert-invite, delete-invite, select-vocabularies, replace-vocabularies; `*-task.sql`
deleted), `repositories/projects/ProjectRepository.ts` (E), `MemberRepository.ts` (C),
`InviteRepository.ts` (C), `TaskRepository.ts` (D), `conflicts.ts` (E),
`domain/projectAccess.ts` (C — including the `PLANES_ARE_DISJOINT` compile-time guard, D2),
`projectAuth.ts` (C — `loadProject`, `requireProjectMember`, `requireProjectPermission`, the 423 lock
check, the 409 archive check, and the outright rejection of API-key-authenticated requests, D2),
`services/ProjectService.ts` (E, rewrite), `services/AccountService.ts` (E: refuse hard delete while
owning projects), `contracts/retention.ts` (E: five `TABLE_LABELS` entries),
`routers/projectRouter.ts` (E, rewrite), `routers/inviteRouter.ts` (C),
`container.ts` (E), `http.ts` (E: `inviteRouter` in `ROUTE_PLUGINS`).

**web** — `types/projects.ts` (E) + `types/projectAccess.ts` (C) + `types/index.ts` (E),
`services/ProjectService.ts` (E), `state/projects.slice.ts` (E, rewrite) + `state/index.ts` (E),
`hooks/useProjectCan.ts` (C), `configs/strings.ts` (E), `configs/entitlements.ts` (E: drop
`project.export`), `modals/keys.ts` (E) + eight modal components (C, including
`LeaveProjectModal.tsx`) + `modals/index.tsx` (E),
`modules/ProjectSwitcher.tsx` (C), `modules/ProjectMembers.tsx` (C), `modules/CreateProjectWizard.tsx` (C),
`modules/SidebarMenu.tsx` (E), `modules/CommandPalette.tsx` (E: rebuilt for the console),
`pages/ProjectMembersPage.tsx` (C), `pages/ProjectSettingsPage.tsx` (C), `pages/ProjectPage.tsx` (C),
`Router.tsx` (E), `styles/modules/_projects.scss` (E) + `styles/modules/_index.scss` (E).

The example's web files do not carry the names an earlier draft of this manifest assumed, so per D1:
**deleted** — `modules/ProjectRoadmap.tsx`, `modals/CreateTaskModal.tsx`,
`modals/ConfirmDeleteTaskModal.tsx`, `modals/ManageAccessModal.tsx`. **Rewritten in place** —
`modules/ProjectList.tsx`, `modules/ProjectDetail.tsx`, `modules/ProjectSettings.tsx`,
`modals/CreateProjectModal.tsx`, `modals/ConfirmDeleteProjectModal.tsx`, `pages/ProjectsPage.tsx`,
`pages/ProjectDetailPage.tsx`. There is no `pages/TasksPage.tsx`.

**docs** — `docs/projects-example.md` → replaced by `docs/projects-and-members.md` (C/E),
`docs/index.md` (E), `docs/access-and-feature-flags.md` (E: the second permission plane),
`docs/notifications-and-moderation.md` (E: the `project_invite` kind).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. `curl -s -X POST localhost:6000/api/projects -b cookie -H 'content-type: application/json' -d '{"name":"Vector Thrust","categories":["Enemies"]}' | jq '.data'` →
   201 with `realmId` set and `permissions` listing all six.
3. Repeat past the plan limit → `400 limit_reached,projects,1`.
4. As a non-member: `GET /api/projects/:id` → **404**, not 403. As a member without `file.write`:
   `POST …/uploads` → 403.
5. Invite an unknown username → 404 and **no** `project_invites` row. Invite an unknown email → 201 and
   an email queued. Invite a permission the inviter lacks → 400 `permission_escalation`.
6. Browser: wizard cannot advance past Configuration with zero categories; **Create new** disappears at
   the project limit; switching projects re-tints the sidebar and re-fetches; deleting the active
   project falls back to the first remaining one after reload.
7. Transfer ownership: the old owner loses access immediately, the new owner's project count moves,
   and a transfer that would blow the recipient's storage cap is refused.

8. Archive a project → every `PATCH`/`POST`/`DELETE` on it returns `409 project_archived`, `GET` still
   works, and it stays listed under `?archived=true`.
9. Accept an invite while signed in as a different address → `invite_email_mismatch`, no membership
   written.
10. Remove a tag from the vocabulary while a bundle uses it → `tag_in_use` with the reference count;
    drop it from the bundle first and the PUT succeeds.
11. Leave a project as a member → it disappears from the switcher; try it as the owner →
    `owner_cannot_be_removed`.
12. Delete an account that owns a project → refused with `owns_projects`; transfer the project, retry,
    and the deletion goes through.
13. `POST /api/projects` twice with the same `Idempotency-Key` → one project, one quota charge.
