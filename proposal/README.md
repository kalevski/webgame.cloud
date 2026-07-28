# WebGame Cloud — feature specification

WebGame Cloud is a platform for people building browser games. A developer creates a project for one
game, uploads art and audio, groups those assets into bundles by tag, presses build, and gets back a
packaged game published to a CDN — with teammates, subscription plans and metered storage around it.

This directory specifies the seven capabilities that make up the product. Each file describes one of
them from the user's point of view — what a developer sees, what they click, what happens next, and
what the rules are — and ends with how its screens are assembled and which components they use.

Every file stands on its own. Nothing here depends on a document outside this directory.

---

## The seven features

| # | File | What it covers |
| --- | --- | --- |
| 1 | [Projects, teammates and permissions](01-projects-and-permissions.md) | Creating projects, switching the active one, membership, invitations, and the per-project permission model |
| 2 | [Game asset files](02-asset-files.md) | Uploading, tagging and categorising the assets every later feature selects over |
| 3 | [Asset bundles](03-bundles.md) | A saved rule for selecting files — the input to a build |
| 4 | [Builds](04-builds.md) | Turning a bundle into a published, versioned artefact |
| 5 | [The build machine](05-build-machine.md) | The realm registry, how a project is assigned to one, moving projects by hand, and the project lock |
| 6 | [Game configuration data](06-config-data.md) | Values a shipped game reads at runtime, keyed by build tag |
| 7 | [Storage and quotas](07-storage-and-quotas.md) | Byte-metered quotas, the grace zone, and what a user sees when they run out |

Read them in order the first time. The dependency runs top to bottom: permissions gate everything,
files are what bundles select, bundles are what builds consume, builds are what configs bind to, and
storage meters the whole thing.

Plus one surface that is not a capability at all — the public page in front of the login:

| | File | What it covers |
| --- | --- | --- |
| — | [Landing page](08-landing-page.md) | The marketing page at `/` — its eight bands and their copy, the visual language, the pricing table that mirrors the quota table, the waitlist form, and the budgets it has to pass |

---

## The shape of the work

| Feature | What it is really about | The hard part |
| --- | --- | --- |
| Teams & permissions | membership grants read, permissions grant write | it changes the authorization check on *every* request |
| Asset files | tagging as the selection primitive | direct-to-worker upload and its reconciliation |
| Bundles | a saved query, not a folder | small — the live preview is the only subtle piece |
| Builds | promotion channels via unique tags | the asset pipeline behind it |
| Build machine | crash-safe heavy work off the request path, on servers outside the app | replay protection, the project lock, and signed transfer instructions |
| Config data | live values keyed by build tag | an unauthenticated public read surface |
| Metered storage | counting bytes, not rows | checked against the pending batch, with a grace zone |

### Cross-cutting UI rules

Three rules hold across every screen:

- **Destructive actions are type-to-confirm.** Deleting a project makes you type its name; cancelling
  a subscription makes you type the plan name; transferring ownership makes you type the project
  name. Applied consistently — anything that destroys data or hands it to someone else asks the user
  to spell it out.
- **Errors are sticky, successes fade.** Error toasts stay until dismissed (`duration: 0`); success
  toasts auto-dismiss.
- **Edits are batched behind Save / Discard**, with an unsaved-changes guard on route change and tab
  close. This holds on every editing surface: files, schemas, configs and project settings.

Deleting a project is not the only way to take one out of circulation — **archiving** freezes a
project reversibly, and is offered alongside delete in project settings.

### The two ideas the design rests on

- **Tags are the join.** Files carry tags; bundles select on tags; builds carry a tag; config versions
  bind to that tag; the SDK loads by that tag. One string threads the whole product together, so the
  tag-editing surfaces — the file tag input and the build-tag picker — carry more weight than their
  size suggests. Get them right and everything downstream works.
- **Nothing that can be slow happens in a request.** Uploads bypass the API and stream straight to the
  build machine, builds are claimed by a poller, status reports are durable, cleanup is a background
  sweep. Every heavy path is queued and recoverable.

---

## Components that solve a named problem

Reaching for these instead of hand-rolling is most of the win:

| Problem | Component |
| --- | --- |
| Editing JSON against a schema without a raw text box | `tc-json-editor` |
| Letting a user define that schema visually | `tc-json-schema-def` |
| Tag entry with a project vocabulary + create-on-type | `tc-tag-input` |
| Showing a build's lifecycle as it progresses | `tc-state-machine` |
| Quota bars without hand-rolling progress + labels | `tc-usage-summary-panel` |
| A drag-drop upload target with format chips | `tc-file-dropzone` |
| Multi-select where each option needs explaining | `tc-multi-card-select` |
| A copyable SDK snippet | `tc-code-snippet` |
