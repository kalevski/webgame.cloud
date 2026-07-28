# Game asset files, tagged and categorised

> Uploading, tagging and categorising the assets every later feature selects over.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What the user does

The developer drags game art, audio and data files into the Files screen of a project. Each file
carries:

- **A category** — one per file, chosen from the project's category list. Clearing it moves the file
  back to *Uncategorized*.
- **Tags** — many per file, chosen from the project's tag vocabulary. Tags are the important ones:
  they are what bundles select on. Tagging a file `level1` and `ui` is how you decide which bundle it
  ends up in.

Both vocabularies are project-scoped and edited in Project Settings → *File Categories* and *File
Tags*, which carry example copy to make the intent obvious (*"ex. 'Enemies', 'Backgrounds', 'Items'"*
and *"ex. 'level 1', 'UI', 'Credits', 'Boss'"*). The tag input autocompletes from that vocabulary and
allows creating a tag on the spot.

The screen is one vertical column — a dropzone, then a collapsible group per category starting with
**Uncategorized**. Renaming is inline. The per-file kebab has two items, **Move to Category** and
**Delete**. Edits are **batched behind Save / Discard** rather than saving per keystroke, flushed
through a bulk endpoint (`PUT /projects/:id/files`, taking a list of
`{id, name?, category?, tags?}`) so re-tagging fifty files is one request.

Uploads in flight appear in an **Upload Queue** panel with a live count badge, so a large drop of
assets is visible while it drains. A file whose type is not supported is rejected visibly, with a
message naming the file — never silently dropped.

The default category for new uploads is a **project setting**, so every teammate sees the same
behaviour.

Without `file.write`, the dropzone, the Save / Discard header and the row actions are absent, and the
file list renders read-only.

## Files can have parents

A file can be a **child of another file** via `parent_file_id` plus a `kind`. The kinds are
`texture`, `normal-map`, `physics`, `audio`, `shader`, `text`, `json`.

One rule is enforced: **a texture may have at most one non-deleted `normal-map` child.** Adding a
second returns `409`. This matters at build time — a normal map is not packed as an ordinary image;
it is composited onto a parallel sheet at the same coordinates as its parent.

## What happens when you upload

The bytes never go through the main API. Requesting an upload does two things and returns one:

1. **The client requests an upload** — `POST /projects/:id/uploads`, one call per file, carrying the
   file's name, size, MIME type, and optionally a `parentFileId` and `kind`.
2. **The API creates the database record** — a `files` row with `upload_status = 'pending_upload'`,
   holding the metadata, the owning project, and the assigned asset id.
3. **The API responds with a JWT and nothing else.** The response body is the token. The asset id,
   the destination and the constraints all travel inside its claims, so there is no second payload to
   keep in sync with the token.

The token is signed with the **`REALM_UPLOAD`** signing key — an RS256 key pair the platform owns.
The private half never leaves the API; the public half is published so anything that needs to verify
an upload token can do so.

### What the token carries

| Claim | Purpose |
| --- | --- |
| `sub` | The asset id the bytes belong to |
| `projectId` | The owning project — the build machine writes under this path |
| `maxBytes` | Hard ceiling for the request body; a larger upload is rejected before it is read |
| `mime` | The declared content type, so the receiver can reject a mismatch |
| `jti` | Unique token id, used for single-use enforcement |
| `iss`, `iat`, `exp` | Issuer and a short lifetime — **15 minutes** |
| `kid` (header) | Which `REALM_UPLOAD` key version signed this token |

### Why a signed token rather than a lookup

The build machine verifies the signature **offline**, against the published `REALM_UPLOAD` public
key. It does not call the API to ask whether an upload is allowed. That keeps the upload path
independent of the API — a slow or unavailable API cannot stall a transfer already in flight — and it
means the receiving machine needs no credential of its own to check the caller's.

The `kid` in the token header names the key version, so a machine holding several public keys knows
which one to verify against. When `REALM_UPLOAD` is rotated, tokens already issued keep verifying
against the retired public key until they expire; the retired key stays published for at least the
token lifetime.

### The rest of the round trip

4. **The browser `PUT`s the bytes directly to the build machine** that hosts this project, presenting
   the token as a bearer credential.
5. **The build machine verifies and stores** — signature, expiry, `maxBytes`, MIME, and that the
   `jti` has not been seen before. A replayed token returns the original result instead of writing
   twice. It then queues the file for compression.
6. **It calls back to the API** (`/internal/uploads/:assetId/finalize`) to flip the row to `ready`.

Because of that round trip, a file is **not instantly ready** when the upload returns. The client
handles it with a sequential upload queue, optimistic "processing" entries keyed by the asset id from
the token, and a bounded reconciliation poll (0.5s, 1s, 2s, 3s, 4s) before warning that a file never
converged. Listings hide `pending_upload` rows, so half-landed files never appear.

If the user closes the tab, the token expires, or the build machine never calls back, the row is
orphaned. An **orphan reaper** sweeps every ~5 minutes and deletes `pending_upload` rows older than
the token lifetime plus a 5-minute grace, in batches, using `FOR UPDATE SKIP LOCKED` so replicas do
not collide. `ready` rows are never touched.

## Data shape

- **Categories are scoped per project.** A category belongs to exactly one project; one project's
  list is invisible to another.
- **Tags live as an array on the file row**, validated against the project's tag vocabulary.
- **Every table carries `created_at`, `updated_at` and `deleted_at`.** Deletes are soft; reads filter
  on `deleted_at IS NULL`.

---

## Screens & components

Screen: **Files — `/projects/:id/files`**

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

| Region | Component | Notes |
| --- | --- | --- |
| Upload target | `tc-file-dropzone` | Fires `tc-files` with `File[]`; renders supported-format chips. **Rendered only with `file.write`** |
| Upload queue | `tc-group` + `tc-queued-file` | Group `label="Upload Queue"` with a count badge; one `tc-queued-file` per pending item |
| Per-file upload progress | `tc-progress` | Driven by real `XMLHttpRequest` progress |
| Category sections | `tc-group` | One collapsible group per category, `Uncategorized` first |
| File row | `tc-file` | Inline-editable name, format badge, size, tag chips, action menu |
| **Tag editing** | `tc-tag-input` | `tc-file` renders tags read-only, so tag editing uses this separate control. Autocompletes from the project's tag vocabulary, with create-on-type |
| Save / Discard | `tc-action-header` | Edits are batched, flushed through the bulk endpoint |
| Move to category | `tc-modal` + `tc-card-options` | A short, known list — cards beat a select |
| Empty / loading | `tc-empty-state`, `tc-skeleton` | |

Without `file.write` the dropzone, the Save / Discard header and the row kebab are all absent, and
the file rows render read-only.

**The upload path is client-orchestrated.** For each dropped file the client requests an upload, gets
back a token, `PUT`s the bytes to the build machine with it, then reconciles. The queue is sequential,
so one file is in flight at a time and `tc-progress` tracks that transfer. The asset id comes out of
the token, and the optimistic row is keyed on it — nothing else in the response needs reading.
