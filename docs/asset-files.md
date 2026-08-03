# Asset files

Art, audio and data files a developer drops into a project. Each asset carries one **category** and many
**tags** — tags are the selection primitive bundles read.

The table is **`assets`**, not `files`: the template's `files` table belongs to the admin storage slice
(avatars, invoice PDFs) and keeps its name. The two never mix, and only `assets` counts against a plan's
storage quota.

## Bytes never pass through the API

1. The client calls `POST /api/projects/:id/uploads` with a name, MIME and size (plus the whole drop's
   `batchBytes` on the first call), and the classification the file should land with: an optional
   `categoryId` and an optional `tags` list (see *What a drop is tagged with* below).
2. The API validates the MIME against `ALLOWED_UPLOAD_MIME` (`domain/assets.ts`), derived from the flat
   `UPLOAD_FORMATS` list in `contracts/assets.ts` — the single source for which extension/mime pairs
   upload. The asset's *kind* is a stored server concept (see *Kinds* below); the grouping of formats into
   display groups (textures, audio, data, plain, fonts) remains a web presentation concern:
   `web/src/configs/kinds.ts` maps each display group to its extensions, lucide icon and colour token, and
   maps the stored `AssetKind` onto a display group. `components/UploadDropzone.tsx` renders the groups as
   a manifest of columns under the drop area (icon, mono label, per-group count, one `.ext` badge per
   format) and feeds the flat format list to the picker's `accept`; `FileList` tints each row's file icon
   with the same group colour. It then checks storage headroom
   against the batch, resolves the requested tags against `project_tags` (`UploadService.resolveTags` —
   case-insensitive match onto the project's canonical tag name, deduplicated, `unknown_tag` on a miss),
   writes a `pending_upload` row carrying the category and tags, and returns **a JWT and nothing else** —
   `sub` is the asset id, and the token carries `projectId`, `maxBytes`, `mime` and a 15-minute `exp`.
3. The client `PUT`s the bytes straight to `realm.base_url/uploads/:assetId` with that token.
4. The realm verifies the token against the published public key, enforces `maxBytes` (the client-declared
   size is otherwise unverifiable), and calls `POST /api/internal/uploads/:assetId/finalize` with the real
   size, checksum and storage path.

`finalize` is idempotent, rejects a realm that does not own the project, and re-checks that the project and
asset row are still live — an upload token outlives its authorisation by up to 15 minutes, and this is the
last point the platform can notice. There is no `jti` denylist in v1.

## What a drop is tagged with

The classification is decided **before** the drop, not after it. `components/UploadDropzone.tsx` closes with
a compact single-line *Applied on upload* row under the format manifest (capped at 100px): the mono title,
a single-select category `tc-extended-select` (the project's categories plus an *Uncategorized* first entry,
which sends no `categoryId`) and a `multiple` tag `tc-extended-select` over the project's tag list —
existing tags only, the same rule the row editor follows. The one-line outcome summary
(`strings.uploadZone.assignSummary`) now lives in the row's `title` tooltip rather than its own line.

The component is prop-driven and store-agnostic; `FileList` owns the two values and passes them to
`enqueueUploads(projectId, files, { categoryId, tags })`, which forwards them on every ticket request in the
batch. The category seeds once per project from `project.defaultCategoryId`, falling back to the first
category; changing it in the dropzone affects that session's uploads only and never writes project settings.
Because the choice is visible above the list, the empty state (*No assets yet*) renders **below** the
dropzone — the first thing a new project shows is the drop area and what it will do, not an empty message.

## Kinds — stored, and split into uploadable vs tool-made

`assets.kind` is a stored database column (CHECK-constrained) drawn from `ASSET_KINDS` in
`contracts/assets.ts`: `texture`, `audio`, `video`, `data`, `plain`, `font`, `normal-map`, `physics`,
`bitmap-font`, `bitmap-font-page`. A plain upload's kind is inferred from its MIME (`inferKind` in `domain/assets.ts`:
`image/*` → `texture`, `audio/*` → `audio`, `video/*` → `video` (mp4/webm), `font/*` → `font`,
json/xml/csv → `data`, otherwise `plain`), so a drop can only produce `UPLOADABLE_KINDS`.

The other four kinds are `TOOL_ONLY_KINDS` — `normal-map`, `physics`, `bitmap-font` and `bitmap-font-page`
— produced by the console's tool pages (see asset-tools.md). For those, `UploadRequest` carries an explicit
`kind` (schema-restricted to `TOOL_ONLY_KINDS`) and an optional `parentAssetId`; `UploadService.resolveKind`
enforces the rules: a declared kind must be tool-only (`asset_type_unsupported`), a parent may only be
declared together with a kind (`invalid_parent`), a `PARENTED_KINDS` kind (`normal-map`,
`bitmap-font-page`) must declare a parent (`parent_asset_required`), a declared parent must be a live,
`ready` asset in the same project (`parent_asset_not_found`, `asset_not_ready`) and the pairing must appear
in `KIND_CHILDREN` (`invalid_parent`). `physics` and `bitmap-font` may be created parentless — a free-hand
collision body, or a bitmap font rendered from a system font. Parent/child rules live in `KIND_CHILDREN`:

- a `texture` may have `normal-map` and `physics` (JSON collision body) children —
  `assets_normal_map_idx` still enforces at most one live normal map per texture;
- a `font` (an uploaded TrueType/OpenType/BMFont file — ttf/otf/fnt; the truetype is the input the font
  editor tool takes) may have `bitmap-font` children;
- a `bitmap-font` may have `bitmap-font-page` children. A bitmap font is **two** files, not one: the
  `bitmap-font` asset holds the atlas descriptor (JSON), and each generated texture page is a
  `bitmap-font-page` child of it. The atlas format is resolved per engine (the bundle's `engine` column) at
  build time. Because the descriptor's own extension is an implementation detail, the Assets list hides the
  `tc-file-ext` line for `EXTENSIONLESS_KINDS` (`web/src/configs/kinds.ts`) — today `bitmap-font` alone.

`patchMany` enforces the pairing: a `parentAssetId` patch is valid only when the child's kind appears in
`KIND_CHILDREN[parent.kind]` (`invalid_parent` otherwise) — which means uploaded root files can never be
manually parented; only tool-created child assets can.

## Serving bytes back — the download ticket

The tool editors need the original bytes (a TrueType file to rasterise, a texture to draw over), and bytes
never pass through the API in either direction. `GET /api/projects/:id/assets/:assetId/source` (any project
member) returns an `AssetSourceTicket`: a URL on the project's realm
(`realm.base_url/files/:assetId?token=…`), the asset's MIME and kind, and an expiry. The token is signed
with the `realm_download` key (same 15-minute TTL as uploads) and carries `sub` (asset id), `projectId`,
`storagePath` and `mime`, so the realm can serve statelessly: it verifies the token, reads `storagePath`
and answers with the stored bytes under the token's `content-type` (the dev stub implements this as
`handleServe` in `realm-stub/src/index.ts`, CORS-open so canvas editors can consume the bytes untainted).
The endpoint refuses assets that are not `ready` (`asset_not_ready`) and projects without a realm
(`realm_unavailable`). The web reaches it through `AssetService.source` / the `loadAssetBlob` slice action,
which fetches the realm URL and hands the editor a `Blob`.

## Editing and deleting

`PUT /api/projects/:id/assets` takes up to 200 `AssetPatch` objects in one transaction, validating every tag
against `project_tags` and every category against `asset_categories` first (`unknown_tag`,
`unknown_category`). Delete soft-deletes the row (freeing quota immediately) and enqueues `realm.purge` for
the bytes.

## Editing a row in place

A row is a single `tc-file` wrapped in `.asset-list__row` — there is no action menu, and delete is the
element's own trailing action button (`actionIcon`/`actionLabel` + the `onAction` callback property, a
`tc-file` affordance since 5.0.17). Everything the row can do is driven through the element's attributes,
properties and events (`modules/FileList.tsx`):

| Surface | Prop / event | Effect |
| --- | --- | --- |
| Kind | `format` | the row's format line shows the asset's *kind* (`Texture`, `Normal map`, `Bitmap font`, …) rather than its mime type — copy comes from `strings.assets.kindLabels`, keyed by `ASSET_KINDS`; the extension stays on its own `tc-file-ext` line, except for `EXTENSIONLESS_KINDS`, which pass `extension=""` and render no ext at all |
| Tag chips | `tags` + `tagIds` + `editableTags` + `onTagsChange` / `tc-tags-change` | chips get per-chip remove buttons and a "+" picker over the project's tag list; a change is `stageEdit({ id, tags })` |
| Category | `categories` + `category` + `onCategoryChange` / `tc-category-change` | an embedded select in the row's sub-row; picking stages `stageEdit({ id, categoryId })` (the *Uncategorized* sentinel option maps to `null`) |
| Child count | `items` | the native nested-item label (`2 items`) — **clickable**: one delegated click handler on `.asset-list` matches `.tc-file-items` and opens `AssetChildrenModal` (`MODAL.ASSET_CHILDREN`) for that row |
| Rename | `onNameChange` / `tc-name-change` | `stageEdit({ id, name })` |
| Delete | `actionIcon="Trash2"` + `onAction` (writers, `ready` rows only — otherwise no `actionIcon`, no button) | opens `ConfirmDeleteAssetModal` |

Tag and category editing are native `tc-file` affordances (`@toolcase/web-components` ≥ 5.0.15): the row's
sub-row holds the category `tc-extended-select` (options are the project's categories plus an
*Uncategorized* sentinel first) and the editable tag chips. There is no `EditAssetModal` any more — inline
editing is the only editing surface, and parent/child links are managed from the children modal. A caller
without `file.write` gets the row `readonly` and no delete button (child assets still appear in the list
itself, and the `items` count stays visible and clickable).

`AssetChildrenModal` lists the children as read-only `tc-file` rows carrying the same kind label, paginated
at 8 per page (`tc-pagination`), each with its own trailing action button (`actionIcon`, writers only —
the action renders even on `readonly` rows) that soft-deletes the child immediately through `deleteAsset`.

Every staged action lands in the module's `dirty` map and raises a `FloatingActionBar` (unsaved-changes
hint plus Discard / Save, the same pattern as the settings screens); the write is one
`PUT /api/projects/:id/assets` on Save (`saveEdits`). Staged tag/category values flow back into the row
through `withDraft`, so the select and chips show the draft, not the saved row.

Because a bundle is a tag query, this path is load-bearing: with no tag editor no bundle can ever match a file
and the whole build path is unreachable from the UI.

## Browsing: one flat list, filtered

`FileList` renders **every asset at one level** — no per-category `tc-group` sections. Categories and tags
became filters, both carried by the shared `FilterBar` (see frontend-architecture.md): a row of category
chips (*Uncategorized*, then each category) each showing its own file count, and a controlled
`tc-tag-input` whose `recommendations` are the project's tags with `allow-create` off — you filter by tags
that exist, you do not invent them here. Category chips are **multi-select and OR**: each click toggles a
chip, a file matches if its category is any of the selected ones, and selecting none means all files —
there is no *All* chip. Multiple tags are **AND**: a file must carry every tag picked, the
same semantics a bundle's `includedTags` uses, so the filter answers "what would this rule match?". Because
grouping no longer carries the category, the category lives in each row's own embedded select (see *Editing a
row in place*). Rows are **not** wrapped in a bordered container — each `tc-file` is its own hairline card with a gap
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


## Deleting an asset (console)

The row's single action is **delete** — the row's trailing `tc-file` action button on each `ready` row
(writers only) opens
`modals/ConfirmDeleteAssetModal.tsx`, which confirms by name, states the storage that will be freed, and
warns when children would be left without a parent. Children are also deletable directly from
`AssetChildrenModal` (no confirmation — the modal already scopes the action to one parent's children).
Everything else — rename, tags, category — is edited inline on the row (see *Editing a row in place*).

`AssetPatch` still carries an optional `parentAssetId` (`null` detaches). `UploadService.patchMany`
validates it the same way it validates category and tags: the parent must exist in the same project, an
asset may not be its own parent, and the child's kind must be allowed under the parent's kind per
`KIND_CHILDREN` (`invalid_parent` in every case).
