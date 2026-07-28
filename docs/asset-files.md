# Asset files

Art, audio and data files a developer drops into a project. Each asset carries one **category** and many
**tags** — tags are the selection primitive bundles read.

The table is **`assets`**, not `files`: the template's `files` table belongs to the admin storage slice
(avatars, invoice PDFs) and keeps its name. The two never mix, and only `assets` counts against a plan's
storage quota.

## Bytes never pass through the API

1. The client calls `POST /api/projects/:id/uploads` with a name, MIME and size (plus the whole drop's
   `batchBytes` on the first call).
2. The API validates the MIME against `ALLOWED_UPLOAD_MIME` (`domain/assets.ts`), checks storage headroom
   against the batch, writes a `pending_upload` row and returns **a JWT and nothing else** — `sub` is the
   asset id, and the token carries `projectId`, `maxBytes`, `mime` and a 15-minute `exp`.
3. The client `PUT`s the bytes straight to `realm.base_url/uploads/:assetId` with that token.
4. The realm verifies the token against the published public key, enforces `maxBytes` (the client-declared
   size is otherwise unverifiable), and calls `POST /api/internal/uploads/:assetId/finalize` with the real
   size, checksum and storage path.

`finalize` is idempotent, rejects a realm that does not own the project, and re-checks that the project and
asset row are still live — an upload token outlives its authorisation by up to 15 minutes, and this is the
last point the platform can notice. There is no `jti` denylist in v1.

`kind` is inferred from the MIME (`image/*` → `texture`, `audio/*` → `audio`, `application/json` → `json`,
otherwise `text`) and is only overridable when a `parentAssetId` is supplied — that is the `normal-map` /
`physics` case. `assets_normal_map_idx` enforces at most one live normal map per texture in the database.

## Editing and deleting

`PUT /api/projects/:id/assets` takes up to 200 `AssetPatch` objects in one transaction, validating every tag
against `project_tags` and every category against `asset_categories` first (`unknown_tag`,
`unknown_category`). Delete soft-deletes the row (freeing quota immediately) and enqueues `realm.purge` for
the bytes.

## Tagging in the console

**`tc-file` renders tags but cannot edit them** — it has no add-tag affordance, so the row's `onTagsChange`
never fires. Tagging is therefore a menu item on each row: *Edit tags* opens `EditAssetTagsModal`
(`MODAL.EDIT_ASSET_TAGS`), a `tc-tag-input` seeded from the project's tag vocabulary as `recommendations`
with `allow-create` on. Saving the modal calls `stageEdit({ id, tags })`, which puts the row in the module's
`dirty` map and raises the Save / Discard header; the actual write happens on Save via `saveEdits` →
`PUT /api/projects/:id/assets`.

This matters more than it looks: a bundle is a tag query, so without a tag editor no bundle can ever match a
file and the whole build path is unreachable from the UI.

## Upload queue and counts in the console

The queue in `FileList` clears itself when a batch finishes — `enqueueUploads` keeps only entries whose
status is `failed`, so a completed upload does not leave a permanently full progress bar behind. Failures
stay visible and are also listed by `strings.assets.rejected`.

The page subline counts `assets.length`, **not** `project.assetCount`. The project row is fetched with the
projects list and is not refreshed after an upload, so using it showed a stale file count beside a live byte
total.

## The orphan reaper

`assets.reap_orphans` runs every 5 minutes and soft-deletes `pending_upload` rows older than 20 minutes —
the 15-minute token lifetime plus a 5-minute grace. `ready` rows are never touched.

Listings exclude `pending_upload` unless `?status=` asks for them, so half-landed files never appear.
