# File storage

Behind the `files` product flag: pluggable upload sources (local disk or an S3-compatible bucket), an
admin-configured mapping from a code-defined file type to the source it lands on, and a small upload API
for the rest of the application to call.

- API: `api/src/domain/storage.ts` (the `StoragePort` registry — `diskStoragePort`/`s3StoragePort`,
  same gateway-agnostic shape as `domain/billing.ts`/`domain/email.ts`), `api/src/services/FileService.ts`,
  `api/src/routers/filesRouter.ts`, `api/src/repositories/files/FileRepository.ts`,
  `api/src/contracts/files.ts`, `api/src/schema/files.ts`.
- Web: `web/src/services/PlatformService.ts` (file methods), `web/src/state/platform.slice.ts` (file
  state, alongside webhooks/API keys), `web/src/modules/FilesAdmin.tsx`, `web/src/modals/AssetSourceModal.tsx`.

## Naming: `asset_` identifiers, `file` concepts

Every `file_`-prefixed identifier in this slice was renamed to `asset_`: the tables (`asset_sources`,
`asset_categories`), the columns (`files.asset_type`, `assets.parent_asset_id`, the `asset_count`
aggregate), the settings keys (`asset_type_source_<type>`), the audit actions
(`create|update|delete_asset_source`, `update_asset_bindings`), the error codes (`asset_source_*`,
`asset_not_found`, `asset_type_*`, `parent_asset_not_found`), the REST prefix (`/api/asset-sources`)
and the contract symbols (`AssetSource`, `AssetSourceDraft`, `ASSET_SOURCE_TYPES`, `ASSET_TYPES`,
`AssetTypeBindings`, `AssetPatch`, `assetType`, `assetCount`, `parentAssetId`).

What deliberately did NOT move: the `files` table and `StoredFile`, `FileService`, `filesRouter`,
`FileRepository` and the `files` feature flag. `assets` is already taken by the product's game-asset
table, so renaming these would collide. The rule when adding to this slice: **snake_case identifiers
use `asset_`; the class/module names for the generic storage plumbing stay `File*`.** One consequence
worth knowing: `AssetType` here means a stored-file category (`profile_picture`), while the product's
per-asset classification is `AssetKind` (`texture`, `audio`, …) in `contracts/assets.ts`.

## Data model

Two tables. `asset_sources` is an admin-created named config row — `type` (`'disk' | 's3'`), a `config`
jsonb blob (`basePath` for disk; `bucket`/`region`/`endpoint`/`forcePathStyle`/`accessKeyId` for s3) and a
`secret` column (the s3 secret access key; empty for disk) that is never returned to the client — the
contract only exposes `secretSet: boolean`, the same pattern `webhook_endpoints.secret` uses. Any number of
sources can exist, including several of the same type (two disks, two buckets). A source's `type` is
immutable after creation — `updateSource` only ever touches `name`/`config`/`secret`.

`files` is one row per uploaded object: `asset_type`, `source_id`, `location` (the key/path inside that
source — `<assetType>/<uuid>`, so storage is naturally namespaced per type), plus `owner_id`,
`original_name`, `mime`, `size`. Both tables follow the standard soft-delete rules
(database-conventions.md).

## The file-type → source binding

`ASSET_TYPES` (`contracts/files.ts`) is a closed, hand-maintained union — exactly like
`LIMITABLE_RESOURCES` or `PERMISSIONS` — that application code extends as it needs new upload slots
(`profile_picture` is the seeded example). It is **not** a database table. The binding from a file type to
the source that serves it is a `settings` row per type (`asset_type_source_<assetType>`, mirroring how
`RoleBindings`/`RetentionPolicy` already use `settings` for a `Record<enum, value>` shape) — resolved via
`FileService.getBindings()`/`saveBindings()`, never a foreign key.

Adding a new file type is a two-line change: add the literal to `ASSET_TYPES` and a label to
`ASSET_TYPE_LABELS`. The admin screen picks it up automatically — no migration, no route change.

## Uploading from application code

```ts
const stored = await container.resolve(FileService).upload(
    'profile_picture',
    user.id,
    buffer,
    { originalName: 'avatar.png', mime: 'image/png' }
)
```

`upload` resolves the bound source for that file type (throwing `asset_type_unassigned` — 503 — if the
admin has not assigned one yet), generates the id with `randomUUID()`, and writes through the matching
`StoragePort`. There is no quota/permission check inside the service — that is the caller's job, exactly
like every other service in this codebase.

The one shipped HTTP surface is generic, not feature-specific: `POST /api/files` (multipart, fields
`assetType` + `file`, gated by `file.upload`) is the worked example proving the port; a real feature (an
avatar upload button, say) either calls `FileService` directly from its own router or reuses this route.
`GET /api/files/:fileId` streams the bytes back (content-type set from the stored `mime`, so the envelope
`preSerialization` hook passes it through untouched — see `http/envelope.ts`) and `DELETE /api/files/:fileId`
soft-deletes the row and best-effort removes the backing object. Both are gated by the same ownership
predicate as everywhere else: `user.role === OWNER_ROLE_ID || file.ownerId === user.id`.

## Admin surface

*Platform → Files* (only listed when the `files` flag is on and the caller holds `file.source.read`) is two
cards, both in `modules/FilesAdmin.tsx`.

**Storage sources** — a `tc-data-list` row per source showing its name, a type badge, the resolved config
(base path, or bucket · region · endpoint) and how many file types currently point at it (`Unused` when
none). Edit and delete are inline row actions (`file.source.write`); the editor itself is
`modals/AssetSourceModal.tsx`, which swaps its fields on the source type and never round-trips the stored
secret. A source cannot be deleted while a file type is still bound to it, or while it already holds files —
`FileService.deleteSource` throws `asset_source_in_use` (409) either way.

**File types** — one row per `ASSET_TYPES` entry: a source dropdown, a status dot naming the bound source
(amber `Not assigned` when there is none), and an `Unsaved` badge on rows edited but not yet saved. An
unassigned type is the one state worth shouting about — uploads of it fail with `asset_type_unassigned`
(503) — so a warning alert above the rows counts them. With no sources configured at all the dropdowns
disable and the card says to create a source first.

Two implementation notes that are easy to regress:

- The "no source" option uses a **non-empty sentinel key** (`UNBOUND`), mapped back to `null` on change.
  `tc-extended-select` cannot select an option whose `key` is `''` — it reads as "nothing selected" — so an
  empty-key option renders but does nothing, leaving the admin unable to clear an assignment.
  (`modules/AccessPolicyAdmin.tsx` still has the empty-key shape in its slot bindings.)
- `tc-data-list` re-renders on `items` assignment, not on `renderRow`. The usage count is therefore folded
  into the items array (`useMemo` over `assetSources` + `fileBindings`) rather than read from a closure, so
  saving a binding updates the count without a reload.

## What is deliberately out of scope

No image processing, no signed upload URLs, no per-type size/mime allow-lists, no quota on the `files`
table. Multipart parsing is `@fastify/multipart` with a flat 20MB request cap
(`UPLOAD_MAX_BYTES` in `filesRouter.ts`) — tighten it, or add per-type limits, in a derived project that
needs them.
