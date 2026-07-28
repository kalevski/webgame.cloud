# Asset files — upload, tag, categorise

> Source: `proposal/02-asset-files.md`. Shared decisions: [`README.md`](README.md).
> Depends on 01 (vocabularies, `file.write`), 05 (realm + signing keys), 07 (storage quota).

## Requirement

A developer drops art, audio and data files into a project. Each file carries one **category** (from the
project's category list, clearable back to *Uncategorized*) and many **tags** (from the project's tag
vocabulary, create-on-type) — tags being the selection primitive every later feature reads. Bytes never
pass through the API: the client asks for an upload, receives a **JWT and nothing else**, `PUT`s the
bytes straight to the project's realm, and the realm calls back to finalise. Files can be children of
other files (`parent_file_id` + `kind`), with one enforced rule: a texture has at most one live
`normal-map` child. Edits are batched behind Save / Discard and flushed through one bulk endpoint.

## Scope

- `assets` table with upload lifecycle, parent/child kinds, tags array, size in bytes.
- `POST /api/projects/:id/uploads` issuing a `realm_upload`-signed token; `/api/internal/uploads/:assetId/finalize`
  consumed by the realm; bulk `PUT /api/projects/:id/assets`; delete.
- Storage quota checked against the pending batch (spec 07 `assertStorageHeadroom`).
- The orphan reaper cron job, and a `realm.purge` enqueue on delete (D7).
- `hooks/useUnsavedChanges.ts` — the shared Save/Discard guard, built here and reused by spec 06.
- Files screen: dropzone, upload queue with live progress, per-category collapsible groups, inline
  rename, tag editing, move-to-category, Save / Discard.

## Non-goals

- No image processing here — packing, normal-map compositing and audio spritesheets are the realm's job
  (spec 04).
- No folder tree. Categories are a flat, project-scoped list; nesting is what tags are for.
- No resumable/multipart upload protocol in v1: one `PUT` per file, sequential queue.
- No versioning of a file's bytes — re-uploading is a new file row.

## Data model

`00001_schema.sql`, after the project vocabularies. The table is **`assets`**, not `files` — the
template already ships a `files` table for the admin storage slice (`file_type`, `source_id`,
`location`) with `files_owner_idx`/`files_type_idx`, and both the table name and two index names would
collide (D9). Game assets live on a realm; admin files live on a `file_source`. They never mix.

```sql
CREATE TABLE assets (
    id             text PRIMARY KEY,
    project_id     text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by    text REFERENCES users(id) ON DELETE SET NULL,
    parent_file_id text REFERENCES assets(id) ON DELETE CASCADE,
    kind           text NOT NULL DEFAULT 'texture'
                   CHECK (kind IN ('texture', 'normal-map', 'physics', 'audio', 'shader', 'text', 'json')),
    category_id    text REFERENCES file_categories(id) ON DELETE SET NULL,
    name           text NOT NULL,
    extension      text NOT NULL DEFAULT '',
    mime           text NOT NULL DEFAULT '',
    size_bytes     bigint NOT NULL DEFAULT 0,
    tags           text[] NOT NULL DEFAULT '{}',
    upload_status  text NOT NULL DEFAULT 'pending_upload'
                   CHECK (upload_status IN ('pending_upload', 'processing', 'ready', 'failed')),
    upload_uuid    text NOT NULL,
    storage_path   text NOT NULL DEFAULT '',
    checksum       text NOT NULL DEFAULT '',
    finalized_at   timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);
CREATE INDEX assets_project_idx ON assets (project_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX assets_tags_idx ON assets USING gin (tags) WHERE deleted_at IS NULL;
CREATE INDEX assets_pending_idx ON assets (created_at) WHERE upload_status = 'pending_upload' AND deleted_at IS NULL;
CREATE UNIQUE INDEX assets_upload_uuid_idx ON assets (upload_uuid) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX assets_normal_map_idx ON assets (parent_file_id)
    WHERE kind = 'normal-map' AND deleted_at IS NULL;
```

`assets_normal_map_idx` **is** the "at most one normal map per texture" rule — a database constraint,
not a service check, so a race cannot produce two. The repository catches `23505` and returns the
`'normal_map_exists'` sentinel.

`assets_tags_idx` is a GIN index because bundles select with `tags && $1` / `NOT (tags && $2)` (spec 03).

Down block: `assets` before `file_categories` and `projects`.

`TABLE_LABELS` gains `assets: 'Game assets'`, default retention `0` — soft-deleted asset rows are the
record of which bytes the purge job was told to delete (D10).

## Contracts

New `contracts/assets.ts` — the template's `contracts/files.ts` belongs to the admin file-storage
slice and is left alone, exactly as the table is (D9).

```ts
export const ASSET_KINDS = ['texture', 'normal-map', 'physics', 'audio', 'shader', 'text', 'json'] as const
export const UPLOAD_STATUSES = ['pending_upload', 'processing', 'ready', 'failed'] as const

export type AssetFile = {
    id: string; projectId: string; parentFileId: string | null; kind: AssetKind
    categoryId: string | null; name: string; extension: string; mime: string
    sizeBytes: number; tags: string[]
    uploadStatus: UploadStatus; uploadUuid: string
    createdAt: string; updatedAt: string
}
export type UploadRequest = { name: string; sizeBytes: number; mime: string; parentFileId?: string; kind?: AssetKind; categoryId?: string }
export type UploadTicket = { token: string; uploadUrl: string; expiresAt: string }
export type FilePatch = { id: string; name?: string; categoryId?: string | null; tags?: string[] }
export type FinalizeUpload = { sizeBytes: number; checksum: string; storagePath: string; status: 'ready' | 'failed'; error?: string }
```

`contracts/errors.ts` adds `file_type_unsupported`, `normal_map_exists`, `upload_not_pending`,
`upload_token_invalid`, `parent_file_not_found`, `unknown_tag`, `unknown_category`.
(`file_not_found` already exists.)

The upload token's claims are exactly the proposal's table — `sub` (asset id), `projectId`, `maxBytes`,
`mime`, `jti`, `iss`, `iat`, `exp` (15 min), `kid` in the header. `SigningKeyService.sign('realm_upload',
claims, { expiresInSeconds: 900 })` produces it; nothing else is returned to the client, because
everything the client needs is inside the token (`sub` is the optimistic row key).

**`maxBytes` is enforced by the realm, and that is the only place it can be.** The client declares
`sizeBytes` when it asks for the ticket, so the quota check runs on a number the caller chose — a
caller can declare 1 byte and stream a gigabyte. The realm refuses the transfer the moment the body
exceeds `maxBytes` and finalises `failed`; the platform corrects `size_bytes` from the realm's report,
never from the client. `docs/signing-keys.md` states this as the claim's purpose.

**The realm verifies the token against the published public key.** The `signingRouter` public-key route
is unauthenticated (a realm holds no session) and serves the current `kid` plus retired ones, so a
rotation does not invalidate the 15-minute tokens already in flight.

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/projects/:id/assets` | `requireProjectMember` | `?categoryId&tag&status` | `project_not_found` |
| POST | `/api/projects/:id/uploads` | `requireProjectPermission('file.write')` | `UploadRequest` | `file_type_unsupported`, `normal_map_exists`, `parent_file_not_found`, `storage_limit_reached`, `storage_hard_cap_exceeded`, `project_locked`, `project_archived` |
| PUT | `/api/projects/:id/assets` | `requireProjectPermission('file.write')` | `{ files: FilePatch[] }` (max 200) | `file_not_found`, `unknown_tag`, `unknown_category` |
| DELETE | `/api/projects/:id/assets/:assetId` | `requireProjectPermission('file.write')` | — | `file_not_found` |
| POST | `/api/internal/uploads/:assetId/finalize` | realm bearer token | `FinalizeUpload` | `file_not_found`, `upload_not_pending` |

Listings **exclude `pending_upload`** unless `?status=` asks for them, so half-landed files never appear.

`UploadService` (new, not the template's `FileService`)

- `requestUpload(user, project, req)` — validate the declared MIME against a code-level allow-list
  (`ALLOWED_UPLOAD_MIME` in `domain/assets.ts`: `image/png`, `image/jpeg`, `image/webp`, `image/ktx2`,
  `audio/ogg`, `audio/mpeg`, `audio/wav`, `audio/mp4`, `application/json`, `application/xml`,
  `text/plain`, `text/csv`, `application/x-font-bmfont`), resolve the parent (kind/parent consistency),
  call `access.assertStorageHeadroom(project.ownerId, batchBytes)` — the client sends the whole drop's
  byte total on the first call, so the check is against the batch, not one file, and **each subsequent
  file re-checks with its own size**, because the declared batch total is a lower bound the caller
  chose. Then insert the row with `upload_status = 'pending_upload'` and a fresh `upload_uuid`, sign
  and return the ticket. `uploadUrl` is `realm.base_url + /uploads/ + assetId`.
- `kind` is **inferred from the MIME** (`image/*` → `texture`, `audio/*` → `audio`, `application/json`
  → `json`, everything else → `text`) and is only overridable when the request carries a
  `parentFileId` — that is the one case where the caller genuinely knows something the MIME does not
  (`normal-map`, `physics`). The realm sniffs the actual content and finalises `failed` on a mismatch.
- `finalize(realm, assetId, body)` — the realm's callback; flips `pending_upload → ready` (or `failed`),
  writes `size_bytes`, `checksum`, `storage_path`, `finalized_at`. **Idempotent**: a second call with the
  same values returns the same 200. Rejects when the row is not pending (`upload_not_pending`), when
  the calling realm is not the project's realm, or when the project or asset row is no longer live —
  an upload token outlives the authorisation that produced it by up to 15 minutes, and finalize is the
  last point at which the platform can notice that the member was removed, lost `file.write`, or that
  the project was deleted meanwhile. There is no `jti` denylist in v1; the re-check plus the 15-minute
  ceiling is the accepted exposure, and it is documented as such.
- `patchMany(project, patches)` — one transaction, validating every tag against `project_tags` and every
  category against `file_categories` before writing, so a fifty-file re-tag is one round trip and one
  atomic result.

Repository: `AssetFileRepository` (BaseRepository) with `listByProject`, `findById`, `create` →
`Result<Row, 'normal_map_exists'>`, `finalize`, `patchMany(trx)`, `softDelete`, `reapOrphans(limit)`.
`reap-orphans.sql` uses `FOR UPDATE SKIP LOCKED`:

```sql
WITH doomed AS (
    SELECT id FROM assets
    WHERE upload_status = 'pending_upload' AND deleted_at IS NULL
      AND created_at < now() - interval '20 minutes'
    ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED
)
UPDATE assets SET deleted_at = now(), updated_at = now()
WHERE id IN (SELECT id FROM doomed)
RETURNING id
```

20 minutes = the 15-minute token lifetime plus the proposal's 5-minute grace. `ready` rows are never
touched. Registered as `registerJobHandler('assets.reap_orphans', …, { cron: '*/5 * * * *' })`, with a
`null` actor on its audit line (D8).

Side effects: `recordAudit(actor, 'file.uploaded' | 'file.updated' | 'file.deleted', assetId)`. No
notification — an upload is not news. Storage overage flagging happens inside `assertStorageHeadroom`.
**Delete enqueues `realm.purge`** with the row's `storage_path` (D7): the soft delete frees quota
immediately, and the bytes follow. Without it, delete-and-re-upload would grow realm disk forever while
usage — which counts only live `ready` rows — never moves.

## Web

- `state/assets.slice.ts` — `files`, `filesLoaded`, `queue: QueuedUpload[]`, `dirty: Record<string, FilePatch>`,
  `fetchFiles(projectId)`, `enqueueUploads(File[])`, `saveEdits()`, `discardEdits()`, `deleteFile(id)`.
  `saveEdits` and `deleteFile` call `void get().fetchProjectUsage(projectId)`; uploads do too on drain.
- **The upload path is client-orchestrated** and lives in `services/UploadService.ts`:
  for each queued file → `POST /uploads` → decode `sub` from the returned token (no second payload) →
  `XMLHttpRequest` `PUT` to `uploadUrl` with `Authorization: Bearer <token>` and real `progress` events
  → optimistic row keyed on the asset id in `processing` → reconciliation poll at 0.5 s, 1 s, 2 s, 3 s,
  4 s, then a warning toast that the file never converged. The queue is **sequential** — one transfer in
  flight, which is what makes a single `tc-progress` meaningful.
- A file whose type is rejected is surfaced by name in a sticky danger alert — never dropped silently.
  So is a re-upload of a name that already exists: the drop is kept (a new row, no byte versioning) and
  the alert says both copies are now in the project, because bundles match on tags and would otherwise
  quietly pick up two.
- Edits are batched: every rename/tag/category change writes to `dirty`, the header shows Save /
  Discard, and route change or tab close warns while `dirty` is non-empty. That guard does not exist in
  the template — **this spec builds `hooks/useUnsavedChanges.ts`** (react-router `useBlocker` +
  `beforeunload`), and spec 06 consumes it.
- Without `file.write`: dropzone, Save/Discard header and row kebabs are absent, and rows render
  `readonly`.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Upload target | `tc-file-dropzone` | `specs/tc-file-dropzone.md` | `supported: DropzoneFileFormat[]` JS prop; `tc-files` → `{ files: File[] }`. Rendered only with `file.write` |
| Upload queue | `tc-group` + `tc-queued-file` | `specs/tc-group.md`, `specs/tc-queued-file.md` | Group `label="Upload Queue"` + `badge` count; `tc-dismiss` cancels an item (host removes it) |
| Transfer progress | `tc-progress` | `specs/tc-progress.md` | Driven by real `XMLHttpRequest` progress events |
| Category sections | `tc-group` | `specs/tc-group.md` | One collapsible group per category, `Uncategorized` first; `tc-toggle` |
| File row | `tc-file` | `specs/tc-file.md` | `name`/`extension`/`format`/`size` attributes; `tags` + `tagIds` + `menuItems` JS props; `tc-name-change`, `tc-menu-item-click`. `readonly` without `file.write` |
| Tag editing | `tc-tag-input` | `specs/tc-tag-input.md` | `tc-file` renders tags read-only, so editing uses this control: `recommendations` from `project_tags`, `allow-create`, `tc-change` → `{ value: string[] }` |
| Save / Discard | `tc-action-header` | `specs/tc-action-header.md` | `actions` JS prop; both dropped without `file.write` |
| Move to category | `tc-modal` + `tc-card-options` | `specs/tc-modal.md`, `specs/tc-card-options.md` | A short known list — cards beat a select |
| Rejected file | `tc-alert` | `specs/tc-alert.md` | `variant="danger"`, names the file, sticky |
| Empty / loading | `tc-empty-state`, `tc-skeleton` | `specs/tc-empty-state.md`, `specs/tc-skeleton.md` | |

No new React component.

## Access policy

Read: any project member. Write (upload, rename, re-tag, move, delete): `file.write`. Finalize: the
project's own realm, authenticated by its bearer token — a realm cannot finalise another realm's
project. Quota: `storage_mb` charged to `projects.owner_id`, checked against the pending batch with the
grace zone from spec 07.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `assets` + five indexes + Down entry).

**api** — `contracts/assets.ts` (C) + `contracts/index.ts` (E), `contracts/errors.ts` (E),
`contracts/retention.ts` (E: the `assets` label), `domain/assets.ts` (C: `ALLOWED_UPLOAD_MIME`,
kind inference, kind/parent rules), `schema/assets.ts` (C),
`repositories/assets/sql/*.sql` (C: select-assets, select-asset, insert-asset, finalize-asset,
patch-asset, delete-asset, reap-orphans), `repositories/assets/AssetFileRepository.ts` (C),
`conflicts.ts` (E), `services/UploadService.ts` (C), `services/AssetService.ts` (C),
`routers/assetRouter.ts` (C), `routers/internalRouter.ts` (C — finalize; realm-authenticated),
`container.ts` (E), `http.ts` (E: two plugins).

**web** — `types/assets.ts` (C) + `types/index.ts` (E), `services/AssetService.ts` (C),
`services/UploadService.ts` (C — the XHR orchestrator), `hooks/useUnsavedChanges.ts` (C),
`state/assets.slice.ts` (C) + `state/index.ts` (E),
`configs/strings.ts` (E), `modals/keys.ts` (E), `modals/MoveCategoryModal.tsx` (C), `modals/index.tsx` (E),
`modules/ProjectFiles.tsx` (C), `modules/UploadQueue.tsx` (C), `pages/ProjectFilesPage.tsx` (C),
`Router.tsx` (E), `modules/SidebarMenu.tsx` (E),
`styles/modules/_files.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/asset-files.md` (C) + `docs/index.md` (E), `docs/signing-keys.md` (E: `realm_upload`
claims), `docs/background-jobs.md` (E: the reaper cron).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. `curl -s -X POST localhost:6000/api/projects/$P/uploads -b cookie -d '{"name":"hero.png","sizeBytes":12345,"mime":"image/png"}' | jq -r '.data.token'` →
   a JWT; decode it and confirm `sub`, `projectId`, `maxBytes`, `mime`, `jti`, 15-minute `exp`, and a
   `kid` header matching the published `realm_upload` key.
3. `POST /api/internal/uploads/<sub>/finalize` with the realm token → the row flips to `ready` and shows
   up in the listing; replay the same call → same 200, no duplicate.
4. Request a second `normal-map` child for one texture → `409 normal_map_exists`.
5. Leave a `pending_upload` row older than 20 minutes (or shorten the interval locally) and run the job
   once from `/admin/jobs` → the row is soft-deleted, `ready` rows untouched.
6. Browser: drop ten files → the queue drains one at a time with real progress, rows appear as
   `processing` then flip to ready within the poll; re-tag fifty files and press Save → **one** request
   in the network tab; without `file.write` the dropzone and kebabs are gone, not greyed.
7. Declare `sizeBytes: 1` and `PUT` a 50 MB body to the stub realm → the transfer is refused on
   `maxBytes` and the row finalises `failed`; usage does not move.
8. Delete a `ready` asset → usage drops immediately, a `realm.purge` job runs, and the stub reports the
   path gone.
9. Navigate away with unsaved tag edits → the guard warns; discard, navigate again → no warning.
