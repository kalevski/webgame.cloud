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

## Editing a row in place

A row **is** a `tc-file` — there is no wrapper element and no sibling controls. Everything the row can do is
driven through that element's own attributes, properties and events (`modules/FileList.tsx`):

| Surface | Prop / event | Effect |
| --- | --- | --- |
| Tag chips | `tags` + `tagIds` | renders the file's tags, resolved against the project's tag list |
| Child count | `items` | the native nested-item label (`2 items`) |
| Rename | `onNameChange` / `tc-name-change` | `stageEdit({ id, name })` |
| Everything else | `menuItems` + `onMenuItemClick` / `tc-menu-item-click` | see below |
| Reserved | `onTagsChange` / `tc-tags-change` | wired, inert — see the note |

The kebab menu is built per row and is the whole editing surface: *Show N child files* (opens
`AssetChildrenModal`, `MODAL.ASSET_CHILDREN`), one **Add tag: x** / **Remove tag: x** entry per project tag,
one **Move to <category>** entry per other category plus **Remove from category**, then *Edit file* and
*Delete*. Keys are namespaced (`tag:<name>`, `cat:<id>`), so `runMenu` stays a flat switch. A caller without
`file.write` gets the row `readonly` — no inline rename, no kebab menu (child assets still appear in the list
itself, and the `items` count stays visible). A writer's row still uploading gets only the child-files entry.

Every action stages into the module's `dirty` map and raises the Save / Discard header; the write is one
`PUT /api/projects/:id/assets` on Save (`saveEdits`). Nothing writes per click.

**`tc-file` cannot emit `tc-tags-change` in `@toolcase/web-components@5.0.14`** — the latest published
version. The element declares `onTagsChange` and `specs/tc-file.md` lists the event, but the shipped build
renders tag chips as plain `<span>`s with no add or remove control and dispatches only `tc-name-change` and
`tc-menu-item-click`. That is why add/remove lives in `menuItems`: it is the one tag-editing path the element
actually supports. The `onTagsChange` handler is wired anyway, so the day the affordance lands the chips start
working with no further change — and the menu entries can go.

Because a bundle is a tag query, this path is load-bearing: with no tag editor no bundle can ever match a file
and the whole build path is unreachable from the UI.

**Renaming is possible from the row** (the element is `readonly` only for callers without `file.write`), while `EditAssetModal` still shows the
filename as static text with the "fixed at upload" reason. The two surfaces disagree — the row is what
changed. Settle it before shipping: either drop that reasoning from the modal, or drop `name` from the row's
patch.

## Browsing: one flat list, filtered

`FileList` renders **every asset at one level** — no per-category `tc-group` sections. Categories and tags
became filters, both carried by the shared `FilterBar` (see frontend-architecture.md): a row of category
chips (*All*, *Uncategorized*, then each category) each showing its own file count, and a controlled
`tc-tag-input` whose `recommendations` are the project's tags with `allow-create` off — you filter by tags
that exist, you do not invent them here. Multiple tags are **AND**: a file must carry every tag picked, the
same semantics a bundle's `includedTags` uses, so the filter answers "what would this rule match?". Because
grouping no longer carries the category, the category moves live in each row's own menu (see *Editing a row in
place*). Rows are **not** wrapped in a bordered container — each `tc-file` is its own hairline card with a gap
between them, so a row reads as one object you can act on.

**Filtering and paging are client-side.** The list endpoint takes `categoryId` and a single `tag`, and the
slice already holds every asset for the project (the header counts and `ProjectPipeline` depend on it), so
filtering in the module is one round trip instead of one per chip click — and it is the only way to support
multi-tag AND at all. The bar's readout owns the match count (`16 of 33 files`); the list's own footer is
therefore just paging — `tc-pagination` at 25 rows a page beside `Page N of M`, rendered only when there is
more than one page. Changing either filter resets to page 1, and a page that no longer exists after a filter
narrows clamps down rather than rendering empty. Filters that match nothing get their own empty state with
*Clear filters*, distinct from the project having no assets at all.

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


## Editing an asset (console)

The asset row is a read-only `tc-file` plus two icon buttons — **edit** and **delete**. There is no kebab
menu and **no inline rename**: `name` is fixed at upload because bundles and shipped manifests reference it,
so the row renders `readonly` and the edit modal shows the filename as static text with that reason spelled
out.

- **Edit** (`modals/EditAssetModal.tsx`) changes category, tags (**picked from the project's tag list — no
  creating new ones here**) and the asset's **child assets**: a table of the files parented to it, each
  detachable, plus a picker that attaches any currently unparented file. Saving sends one `PUT
  /api/projects/:id/assets` carrying the asset's own patch plus one `{ id, parentAssetId }` patch per
  attach/detach.
- **Delete** (`modals/ConfirmDeleteAssetModal.tsx`) confirms by name, states the storage that will be freed,
  and warns when children would be left without a parent.

`AssetPatch` gained an optional `parentAssetId` for this (`null` detaches). `UploadService.patchMany`
validates it the same way it validates category and tags: the parent must exist in the same project and an
asset may not be its own parent (`invalid_parent`).
