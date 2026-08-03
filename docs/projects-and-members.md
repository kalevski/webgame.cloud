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

The two `/api/admin/projects…` read endpoints deliberately sit **outside** these guards — they are gated by
the platform permission `admin.project.read` instead, return the `AdminProject` shape (no `permissions`,
no `isOwner`), and grant no project-plane rights. See platform-directories.md.

## Creating a project

**The wizard is a page, not a modal** — `/projects/new` (`pages/CreateProjectPage.tsx` → `modules/CreateProject.tsx`),
reached from the project switcher, the dashboard onboarding card and the ⌘K palette. Three steps — **Project**, **Configuration**, **Review**. The preview is the last step rather than a
side panel: the wizard is a single column, and step three shows the `ProjectPreview` card with the
**Create** button, which only appears there and only once the required fields (name, at least one category)
are filled.

Step one carries the name field — a `tc-input-group` holding a bare `tc-input` and a `tc-icon-button`
(`Dices`) that rolls a random name, so the generator reads as part of the control rather than a second
button competing with it; the label moves out to a sibling `tc-label required` and the hint stays in
`tc-helper-text` below — the app-type picker (`components/ChoiceCards.tsx`, the landing
engine-card visual — icon, name and note only; `detail` and `tags` are optional on `ChoiceCardOption` and
the app-type options omit them, while the bundle wizard's engine cards still pass both), a **genre** picker that selects a matching icon and seeds a few asset tags (both stay
editable), an icon and colour picker, and a markdown description editor. Step two is the three lists with per-field guidance and recommendations.

**Each step sits in its own `tc-panel bordered`** (`.project-wizard__panel`), so a wizard step reads as the
same white card as a settings tab. The step-2 and step-3 `tc-alert` intros go *inside* the panel, mirroring
how the categories-and-tags card carries its own intro line.

**Back / Next / Create project / Cancel live in the floating action bar**, not in the panel — see
[frontend-architecture.md](frontend-architecture.md). The label reads `Step N of 3 — <step>`, and the
buttons are conditionally rendered per step rather than toggled with `hidden`, which is what lets the bar
know whether it has any actions at all.

**The wizard carries no measure of its own.** It fills `.console-page`, so the stepper and every step panel
line up with `tc-rich-page-header` above them, and the floating action bar — which measures its own anchor —
lines up with both. The page reads as one column rather than a narrow form floating under a full-width
header. `.project-wizard`, `.project-wizard__form` and the old in-flow action row each used to cap themselves
at `56rem`; independent copies of a measure drift the moment one is edited, which is how the buttons once
ended up narrower than their own panel. Nothing under `.project-wizard` sets a width now — if the wizard ever
needs a narrower measure again, set it once on `.project-wizard` and let the children inherit.

Step 3 needs one extra rule. `ProjectPreview` paints its own border, radius and tinted background, so
dropping it into a panel gives a card inside a card; `.project-wizard__panel .project-preview` therefore
strips all four back off. Reuse the preview outside a panel and it keeps its card styling.

`components/ProjectPreview.tsx` and `ChoiceCards` are shared with the settings screen, so both surfaces stay
identical by construction.

### Genre

`projects.genre` is a stored column (`text NOT NULL DEFAULT ''`), editable from the wizard **and** from
Settings → General. It was client-only wizard state until it needed to be editable after creation; a control
that forgets what you picked the moment you reload is worse than no control.

**The option list follows the app type**, because a game's genres are not an app's
(`web/src/configs/genres.ts`):

| App type | List | Contents |
| --- | --- | --- |
| `game` | `GAME_GENRES` | action, platformer, puzzle, rpg, strategy, racing, sports, arcade, adventure, simulation, horror, casual |
| `app` | `APP_GENRES` | tool, editor, viewer, dashboard, showcase, portfolio, companion, docs |
| `prototype` | `PROTOTYPE_GENRES` | a curated merge — action/puzzle/arcade from games, tool/viewer/showcase from apps, plus sandbox and mechanic-test |

Every list ends with a shared **Other** entry, so no app type can leave a project with nothing honest to
pick. It is the one genre with an empty `icon` and empty `tags`: both surfaces only apply the genre's icon
when the genre actually has one, because *Other* says nothing about what the project looks like and should
not overwrite an icon the user already chose. It is also present in all three lists, so switching app type
never clears it.

`genresFor(appType)` is the single accessor; `GENRES_BY_APP_TYPE` is the map behind it. The prototype list
is deliberately a **short** merge rather than the full union of the other two, matching the wizard's own
advice to keep a prototype's vocabulary small.

`GENRE_BY_KEY` spans all three lists, so a project keeps rendering its genre label even if the list it came
from is no longer the one its app type offers. Both surfaces guard the other direction: switching app type
clears a genre that the new list does not contain, and clears the `tc-extended-select` with it — otherwise
the control keeps displaying a label that is no longer selectable.

`ProjectService.create` runs one `Database.transaction`: quota check (`assertWithinLimit(user, 'projects')`)
→ realm selection (`RealmService.requireRealm`, 503 `realm_unavailable` rolls the whole thing back) →
insert project → insert the owner's member row with the full permission array → insert the three
name lists (categories, asset tags, build tags). At least one category is required (`category_required`).
`POST /api/projects` honours `Idempotency-Key`.

## Members and invitations

The members screen (`modules/ProjectMembers.tsx`) is a `tc-advanced-table` behind a `tc-tab-bar` — **Members**
and **Invites** are tabs, each in a plain `tc-panel bordered` so they read as the same card as a settings tab.
The permissions guide below keeps its titled `tc-section-card`, because it is reference material rather than
the screen's subject. Each member row edits its own permission set inline through a multi-select
`tc-extended-select` whose `items`/`values` are assigned imperatively after each row render (a custom element
inside a table row string cannot receive JS properties any other way) — through `wireSelect`, which assigns
`items` once per element (`data-wired`) and writes `values` only when the set differs, so a pick does not
clear the search box. See *A table rebuild destroys the controls inside its rows* in
frontend-architecture.md for why the table's own props must be identity-stable too. Rows the caller cannot edit (the
owner's row, and every row for a viewer without `member.manage`) render a compact summary instead of one
badge per permission: a mono `N/6` count chip, then either *All permissions* or the first two permission
labels plus *+N more*, with the full comma-separated list in the cell's `title` tooltip. An empty set stays
the muted *Read-only* line. Six badges per row made the column the widest thing in the table while carrying
no per-row information a count doesn't.

**Both tables edit permissions in place**, through the same multi-select: members via `data-member`, pending
invites via `data-invite`. Editing an invite needs `PATCH /api/projects/:id/invites/:inviteId`
(`patchInviteEndpoint` → `ProjectService.updateInvitePermissions` → `InviteRepository.setPermissions`), which
runs the **same `assertNoEscalation` guard** as sending one — an invite is a permission grant waiting to
happen, so editing it must be as constrained as issuing it. Both routes sit behind
`requireProjectPermission('member.manage')`, and the change is audited as `invite.permissions_changed`.

**Permission edits are batched, not saved per dropdown.** A `tc-change` out of a row lands in a `pending`
map keyed by member id, or `pendingInvites` keyed by invite id; the floating action bar appears with
*Save changes* and *Discard* while either is non-empty, and its label counts both. An edit that returns a member to the permission set they already have deletes its entry rather
than storing a no-op, so putting a checkbox back the way you found it makes the bar go away. Saving walks the
map, keeps any row whose update returned `false`, and clears the rest — a partial
failure leaves exactly the failed rows dirty. *Discard* empties the map and bumps a `seed` counter that the
imperative row effect depends on, which is what forces the selects to re-read from the store; without it the
dropdowns would keep showing the abandoned edits.

**The change listener is native, not React's `onChange`.** `tc-extended-select` emits a `tc-change`
`CustomEvent`; React's synthetic `onChange` only bridges native `input`/`change`, so a `tc-change` bubbling
to a container with `onChange={…}` is never delivered and the edit silently does nothing. The module
attaches a real `addEventListener('tc-change', …)` to its root instead. Anything else that catches events
from these table-embedded custom elements must do the same.

The same `tc-extended-select multiple` is the permission control in `modals/InviteMemberModal.tsx`. It
replaced a `tc-multi-card-select`, so the two places you assign project permissions now look and search the
same way.

Below the table sits a permanent explanation of every project permission (label, key and hint straight from
`PROJECT_PERMISSION_LABELS` / `PROJECT_PERMISSION_HINTS`) plus a recommendation on how to distribute them.

- `GET/PATCH/DELETE /api/projects/:id/members[/:memberId]` — roster management behind `member.manage`.
- `DELETE /api/projects/:id/members/me` — any member except the owner can leave.

Every route above is project-plane, so a staff account that is not a member gets a 404 from `projectAuth`
before the handler runs. Staff read the roster through the separate, read-only
`GET /api/admin/projects/:id/members` (`admin.project.read`) instead — see platform-directories.md.
- `POST /api/projects/:id/invites` — an invite carries the exact permission set it will materialise. A
  member can never grant a permission they do not hold (`permission_escalation`). Team size is charged to
  the project owner (`members_per_project`, counting members **and** pending invites).
- Delivery: an in-app `project_invite` notification when the address matches an account, otherwise the
  seeded `project-invitation` email template. With the `email` flag off and no matching account the invite
  is refused (`invite_undeliverable`) rather than written.
- `POST /api/invites/:id/accept` and `POST /api/invites/:id/decline` both verify the session's email
  matches the invite (or its `user_id`), otherwise `invite_email_mismatch` — without that check the invite
  id is a bearer token to the project (accept) or a deletion key for anyone's invitation (decline). Accept
  adds the membership and stamps the invite in one transaction; decline soft-deletes the invite
  (`InviteRepository.revoke`). Invites expire after 7 days.
- The invited user answers from the **dashboard**: `Dashboard.tsx` fetches `GET /api/invites`
  (`myInvites` in the projects slice) and, when any are pending, renders a *Project invitations* panel
  above the columns — project name, `Invited by <name> · N permissions · Expires <date>`, an
  *Accept* / *Decline* pair per row. Accept refreshes the project list, makes the joined project active and
  navigates into it; decline just drops the row. The `project_invite` notification links `/invites/:id`,
  and the router redirects `/invites` and `/invites/:id` to `/dashboard`, so both the notification click
  and the emailed `inviteUrl` land where the panel is (unauthenticated visitors pass through the login
  redirect first).
- UI: *Invite* is the `MembersPage` header action (gated on `member.manage`); removal is a per-row icon
  button behind the remove-member confirmation.

## Project settings

Settings is **two routed tabs** — `/projects/:id/settings` and `/settings/categories-and-tags`, both served
by `pages/ProjectSettingsPage.tsx` through the `:tab` route param and `components/RouteTabs.tsx` (the same
shape `/billing/:tab` uses). An unknown `:tab` renders General rather than redirecting, which is also what
retires the old `/settings/danger` link cleanly — it now lands on General, where the danger zone lives. Each
tab owns its own draft state and its own save, so leaving a tab discards only that tab's unsaved edits:

- **General** (`modules/ProjectSettingsGeneral.tsx`) — name, `ChoiceCards` app-type picker, genre picker,
  icon picker, colour picker and markdown description. Picking a genre also sets the icon, exactly as it
  does in the wizard. *Save* sits in the floating action bar, gated on
  `project.settings` — a member without it gets no bar at all rather than a disabled button. These are the **same components the create page uses**, so the
  two surfaces cannot drift apart. There is no live preview.
- **Categories & tags** (`modules/ProjectSettingsCategoriesAndTags.tsx`) — three `tc-tag-input`s (categories, tags,
  build tags) in a plain `tc-panel bordered`, the same card General uses. It was a `tc-section-card`, whose
  titled header made the two tabs read as different kinds of screen; the tab label already says what the card
  holds, so the title was redundant as well as inconsistent. Seeded from `GET /api/projects/:id/categories-and-tags` and saved in one `PUT` through
  `saveCategoriesAndTags`. Adding is always safe; removing a name something still references comes back as
  `tag_in_use` with the reference count and surfaces as an alert, which the card warns about up front. At
  least one category must remain, so the save button disables when the category list is emptied. The fetch
  now only fires when this tab is open, rather than on every visit to Settings.
  **Its suggestions follow the project's app type** — see below.
`modules/ProjectSettingsDanger.tsx` — `tc-danger-zone-actions` (archive, transfer, delete) for the owner, a
single *Leave project* button for everyone else — is **not** a tab. It renders at the bottom of General, below
the save button, as its own red-bordered card: destructive actions belong on the page you already edit the
project from, and a tab of their own gave three destructive buttons the same billing as the whole rest of
settings.

Nothing under `.project-settings` sets a width — the form fills `.console-section`, so each tab's panel
lines up with the tab bar and `tc-rich-page-header` above it. `.project-settings__form` used to cap itself
at `52rem`, which left every settings panel visibly narrower than the header it sat under.

The page title stays *Settings* on both; the header subline changes per tab
(`strings.projects.generalDescription` / `categoriesAndTagsDescription`), so the shell says which of the two
you are on.

### Suggestions follow the app type

`strings.projectWizard.categoryAndTagRecommendations` is keyed by `AppType` (`game` / `app` / `prototype`),
and the Categories & tags tab indexes it with `project.appType`. Each entry carries the three suggestion lists
fed to the `tc-tag-input` `recommendations` property (the type-ahead dropdown) and the three `Lightbulb`
helper lines under the inputs. Because the key type is `AppType`, adding a fourth app type fails to compile
until its set exists — the map is exhaustive by construction, with no fallback branch to go stale.

The card does not announce that it is doing this. An earlier version opened with a line naming the app type
and pointing at General; it was noise above three inputs that already explain themselves, and it put a
second instruction in front of the one the user came for.

The sets differ because the pipeline differs: a **game** gets the full spread
(`sprites/audio/fonts/data/shaders/video`, level and platform tags, `release`/`beta`/`dev` channels); an
**app** has no HUD or levels, so it gets `icons/images/fonts/data`, surface and theme tags, and two
channels (`release`/`staging`); a **prototype** is deliberately starved — `art/audio/data`, `wip`/`test`,
and a single `dev` channel — because the wizard already tells that user to keep the tag list small and
delete it without regret.

These are suggestions only — nothing is auto-applied, and the wizard's own flat
`categoryRecommendations` / `tagRecommendations` / `buildTagRecommendations` lists still drive
`modules/CreateProject.tsx`. Pointing the wizard at the same map is the obvious follow-up, since it knows
the app type at the moment it asks for them.

## Categories and tags

Three flat, project-scoped lists: `asset_categories`, `project_tags`, `project_build_tags`. `PUT
/api/projects/:id/categories-and-tags` replaces all three. Removing a name that is still referenced (by an
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
- A trailing **Create new project** entry that navigates to `/projects/new`. It is **appended only while
  `projects.used < limit`** — at the plan ceiling it is removed, not disabled, so there is no dead control
  to click.
- The project's colour and icon are rendered **inside the select itself**, not as a sibling element: the
  module sets `--project-accent` and `--project-icon` on its root and `styles/modules/_console.scss` overrides
  `.tc-extended-select__trigger` — tinted fill, tinted border, coloured caret, and the lucide glyph drawn as a
  `mask-image` on the trigger's `::before`. `helpers/iconMask.ts` turns an icon name into that data-URI mask
  (`lucide-static`, declared as a web dependency). `components/ProjectIconTile.tsx` is still used where a real
  tile is wanted — the project preview card and the dashboard's recent-projects rows.
- `tc-extended-select` always renders a reserved `.tc-field-message` slot under its trigger for help and
  validation copy. The switcher passes neither, so `_console.scss` hides that node inside
  `.module-project-switcher__select` — otherwise the sidebar carries an empty line between the switcher and
  the nav below it.
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
