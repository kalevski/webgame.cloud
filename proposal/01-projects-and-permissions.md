# Projects, teammates and per-project permissions

> Membership, invitations and the per-project permission model.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## Creating a project

A project is the workspace for one game. Any signed-in developer can create one, and the person who
creates it becomes its **owner**.

Creation runs through a three-step wizard:

| Step | What it asks |
| --- | --- |
| **Project** | **Project name** (required; the placeholder suggests one, and the helper says *"Choose a name that captures the essence of your project. You can always change it later!"*), **Description**, and the **application type** as a row of cards — the first type is preselected |
| **Configuration** | **Project icon** and **project colour**; the three project vocabularies — **File Categories**, **File Tags**, **Build Tags** — each a create-as-you-type tag field seeded with recommendations; and an **Include Getting Started assets** toggle that seeds the new project with a small starter set |
| **Review** | The whole configuration laid out for confirmation before anything is written |

**At least one file category is required** to leave the Configuration step. Everything else has a
sensible default, so a user who just wants a project can accept the suggestions and continue.

The vocabularies are collected up front because they are what everything downstream selects on: file
tags feed bundle queries, build tags feed config versions. Starting a project with an empty tag
vocabulary makes the next three screens feel broken, so the wizard asks once rather than sending the
user to settings later.

### What happens on the server

Creating a project is a single transaction:

1. **Quota check.** The project count is checked against the creator's plan. Over the limit → the
   request is refused and the client raises the plan-limit modal naming `projects`.
2. **Realm selection.** The project is pinned to a build machine — tier-aware, capacity-aware,
   least-loaded, with the user's preferred realm as an override. **If no realm can host it, creation
   fails with `503` and the whole transaction rolls back**, so a realm-less project that could never
   accept an upload is never created.
3. **Ownership.** `owner_id` is set, and the owner is inserted into the member list in the same
   transaction, so they appear in the roster like everyone else.
4. **Seeding.** The chosen categories, tags and build tags are written to the project; if *Include
   Getting Started assets* was left on, the starter assets are created too.

Because the quota is account-level, the **Create new** entry disappears from the project switcher once
the creator is at their plan's project limit — it is removed, not disabled, so there is no dead
control to click.

## The active project

Almost every screen — files, bundles, builds, configs, members, settings — is scoped to one project,
so the console always has an **active project**. It is chosen from a dropdown at the top of the
sidebar listing every project the user is a member of, each with its name, description and icon, plus
a trailing **Create new** entry.

Selecting a project makes it active immediately. There is no confirmation and no page reload: the
sidebar re-tints to that project's colour, and every project-scoped screen re-fetches against the new
id.

The choice **persists per browser** under an `activeProjectId` key in local storage, so returning to
the console lands the user where they left off. Resolution on load is defensive:

- If the stored id still matches a project the user can see, it stays active.
- If it does not — the project was deleted, ownership was transferred away, or the user was removed
  from it — the **first available project becomes active** and the stored value is rewritten.
- If the user has no projects at all, there is no active project, and the dashboard shows the
  onboarding path to create one.

Deleting the active project clears the stored id as part of the delete, so the fallback runs on the
next fetch rather than leaving a dangling reference.

Switching also **drops any project-lock state immediately** — a migration banner belonging to the
previous project must never linger over the new one. Lock state is re-established by the incoming
project's own poll.

## The model

Membership and permissions govern who can do what inside a project. Everyone other than the owner has
to be invited in.

There are no roles. Membership grants **read**; permissions grant **write**. Concretely:

- **Every member can read everything in the project.** Files, bundles, builds, configs, settings,
  the member list — all of it. There is no "viewer" level because read is the floor, not a rung.
- **A member with no permissions has read-only access to the whole project.** That is the default,
  and it is a coherent, useful state.
- **Each permission grants writes in one area.** Nothing else.

| Permission | What it lets you write |
| --- | --- |
| `member.manage` | Invite, remove, and change other members' permissions |
| `project.settings` | Edit project settings — name, description, categories, tags, build tags |
| `file.write` | Upload, rename, re-tag, move and delete files |
| `bundle.write` | Create, edit and delete bundles |
| `build.run` | Trigger builds, set build tags, delete and purge builds |
| `config.write` | Create and edit schemas, configs and config versions |

One permission per feature. A new feature brings its own key.

Permissions are chosen over roles because a fixed set of roles is a guess about how teams divide
work, and it is usually wrong. Permissions let a project say "Ana uploads art, Ben tunes configs,
nobody else writes anything" without inventing an "Artist" role that means something different in the
next project.

## Owner sits outside the permission system

Owner is a column on the project, not a membership flag. The owner implicitly holds every
permission — resolved at request time, never stored — and two actions are owner-only no matter what
anyone else is granted:

- **Delete the project**
- **Transfer ownership**

Both live in Project Settings under a **Danger Zone**, and both are type-to-confirm: the user types
the project name exactly before either proceeds. Transfer is a debounced user search ("Enter at least
2 characters to search.") carrying a blunt warning — *"Transferring ownership will move the project to
the new owner's account and revoke your access."*

A third, non-destructive option sits beside them: **archiving** freezes a project reversibly, so
taking a project out of circulation does not require destroying it.

## Permissions are per project, always

The same person can hold `file.write` on one project and nothing on another. There is no global "can
edit files" — a permission without a project is meaningless. Every write handler asks two questions,
in this order:

1. Are you a member of *this* project? If not → **`404`**.
2. Do you hold *this* permission on *this* project? If not → **`403`**.

The order matters, and so does the `404`. **A non-member gets `404`, not `403`** — if you are not in
a project, it does not exist as far as you are concerned, and you cannot probe for it.

## Invitations carry their permissions

An invite is not "join and we'll sort it out later". The inviter picks the permission set when they
send it, and accepting materialises exactly that set. An invite row carries `email`/`username` plus a
`permissions[]` array, and the accept step copies it onto the new membership.

Sending an invite requires `member.manage`, and **you cannot grant a permission you do not hold
yourself**. Without that rule, any member with `member.manage` could invite themselves a second
account with the full set. The invite UI offers only the permissions the inviter holds; the owner
sees all of them.

## How an invitation reaches someone

Two delivery paths, chosen automatically:

- **The invited person already has an account** → an **in-app notification** carrying the invite id,
  with accept and decline in the bell inbox. Accepting adds the membership and deletes the invite.
- **Nobody with that address exists yet** → an **email** (`project-invitation` template) with a join
  link and an expiry line.

Inviting a **username** that does not exist is a hard `404` and records nothing — no dangling invite,
no email. An unknown **email** is fine; that is the point of an email invite.

Invites expire after **7 days**. Pending invites are listed with their permission set and can be
revoked.

## Team size is charged to the project owner

Team size is a **billing quota**, and it is counted against the **project owner**, not whoever clicks
invite. A member on a Studio owner's project gets Studio's team limit there, and their own free-tier
limit on their own projects.

---

## Screens & components

Three surfaces: the **project switcher** in the sidebar, the **create-project wizard** it opens, and
the **members screen** at `/projects/:id/members`.

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

### Project switcher

Lives at the top of the sidebar, above the nav, and is present on every project-scoped screen.

| Region | Component | Notes |
| --- | --- | --- |
| The switcher | `tc-dropdown` | One entry per project — name, description, icon — plus a trailing **Create new**. Selecting a project calls the store's set-active action; selecting *Create new* opens the wizard modal |
| Quota gate | — | The **Create new** entry is appended only while the project count is below the plan limit. Removed, not disabled |
| Sidebar tint | — | The active project's colour drives the sidebar accent, so the switch is visible without reading the label |

### Create-project wizard

A modal, opened from the switcher and from the dashboard onboarding card.

| Region | Component | Notes |
| --- | --- | --- |
| Wizard shell | `tc-modal` + `tc-stepper` | Three steps — Project / Configuration / Review. `steps` JS property, `active-step` attribute |
| Name, description | `tc-form-input` | Name required; placeholder suggests one |
| Application type | `tc-card-options` | Radiogroup; first type preselected. `options` JS property, fires `tc-change` |
| Icon and colour | `tc-icon-picker`, `tc-color-picker` | |
| The three vocabularies | `tc-tag-input` ×3 | File categories, file tags, build tags — each with recommendations and create-on-type. **At least one category is required to advance** |
| Getting-started assets | `tc-switch` | Defaults on |
| Review | `tc-badge-row` | The collected configuration as key/value chips before committing |
| Quota refused | `tc-modal` + `tc-alert` | If the server refuses on quota, the plan-limit modal names `projects` |

### Members screen

Two tabs: roster and pending invites.

| Region | Component | Notes |
| --- | --- | --- |
| Header + Invite action | `tc-action-header` | The `invite` action is present only with `member.manage`; fires `tc-exec` |
| Tab switch | `tc-tab-bar` | `tabs` JS property — `Members (n)` / `Invites (n)` |
| Roster | `tc-data-list` | A member list is small and unfiltered; `items` + delegated row actions is a better fit than a table. Move to `tc-advanced-table` only if projects routinely exceed ~50 members |
| Per-row identity | `tc-avatar` | Image or derived initials |
| Granted permissions | `tc-badge-row` | One key/value chip per permission — reads at a glance, no truncation games. `badges` JS property |
| Row actions | `tc-action-items` | Kebab — *Edit permissions*, *Remove* — rendered only with `member.manage` |
| Empty roster / invites | `tc-empty-state` | |
| Loading | `tc-skeleton` | `variant="text"`, `count` for the row count |

**Invite modal:**

| Field | Component | Notes |
| --- | --- | --- |
| Email or username | `tc-form-input` | One field; the API accepts either, but not both |
| Permission picker | `tc-multi-card-select` | The roomy option — each permission gets a card with a label *and* a one-line description, which matters when the names are new to the user. `options` + `value` JS properties, fires `tc-change` |
| "No permissions = read-only" hint | `tc-alert` variant `info` | Say it explicitly. An empty selection is a valid, deliberate choice, and users will not assume that |
| Footer | `tc-button` ×2 | `slot="footer"` must be a **direct child** of the modal, not nested in a wrapper div |

**Edit-permissions modal** — same data, compact context, so use `tc-checkbox-group` instead: an
inline coordinated group with `options`/`value` JS properties and a `tc-change` event. Prefill from
the member's current set.

**Remove member** — a confirmation modal naming the member, with a danger-variant confirm button.

**Grant intersection.** The picker offers only permissions the *inviter* holds; the owner sees all.
Filter the `options` array rather than disabling entries — a disabled control with no explanation
invites a support ticket.
