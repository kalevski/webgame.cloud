# Bundles — a saved file query

> Source: `proposal/03-bundles.md`. Shared decisions: [`README.md`](README.md).
> Depends on 01 (`bundle.write`, build-tag vocabulary), 02 (files + tags), 07 (`bundles_per_project`).

## Requirement

A bundle is a **saved rule for selecting files**, not a folder: included/excluded tags plus an optional
category, a target engine, packing options, and an optional build tag naming the publish channel it
builds into. Any `ready` file matching the rule is in the bundle; re-tagging a file changes bundle
contents with no further action. The create/edit form is a four-step wizard whose third step is a live,
server-counted **preview** of what the rule currently matches. Deleting a bundle deletes its builds.
Bundles are quota-limited per project and charged to the project owner.

## Scope

- `bundles` table + CRUD + the preview endpoint.
- `resolveBundleUploadIds(bundleId)` — the shared resolver spec 04 consumes at build time, including
  the parent/child `relations` array.
- Bundles screen: card grid with per-card **Run Build** / **Edit** / **Delete**, and the four-step
  wizard modal.

## Non-goals

- No manual file assignment, ever — that would make the rule a lie.
- No bundle-level versioning or diffing between rules; the build snapshot (spec 04) is the record.
- No cross-project bundles.

## Data model

```sql
CREATE TABLE bundles (
    id                text PRIMARY KEY,
    project_id        text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name              text NOT NULL,
    engine            text NOT NULL DEFAULT 'phaser' CHECK (engine IN ('phaser', 'pixi', 'custom')),
    category_id       text REFERENCES file_categories(id) ON DELETE SET NULL,
    included_tags     text[] NOT NULL DEFAULT '{}',
    excluded_tags     text[] NOT NULL DEFAULT '{}',
    build_tag         text NOT NULL DEFAULT '',
    algorithm         text NOT NULL DEFAULT 'max-rects'
                      CHECK (algorithm IN ('basic', 'max-rects', 'shelf', 'guillotine')),
    downscale         integer NOT NULL DEFAULT 100 CHECK (downscale BETWEEN 1 AND 100),
    rotation_enabled  boolean NOT NULL DEFAULT false,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);
CREATE UNIQUE INDEX bundles_name_idx ON bundles (project_id, lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX bundles_project_idx ON bundles (project_id) WHERE deleted_at IS NULL;
```

`build_tag` is free text validated against `project_build_tags` at write time — a text column rather
than an FK because the tag vocabulary is editable and a bundle should not block renaming a tag.

Down block: `bundles` after `builds` (builds reference it), before `projects`.

Delete is a CTE soft-deleting the bundle **and its builds and build files** — the proposal's warning
*"All builds associated with this bundle will also be deleted."* is a promise the SQL keeps.

## Contracts

`contracts/bundles.ts`:

```ts
export const BUNDLE_ENGINES = ['phaser', 'pixi', 'custom'] as const
export const PACKING_ALGORITHMS = ['basic', 'max-rects', 'shelf', 'guillotine'] as const

export type Bundle = {
    id: string; projectId: string; name: string; engine: BundleEngine
    categoryId: string | null; includedTags: string[]; excludedTags: string[]
    buildTag: string; algorithm: PackingAlgorithm; downscale: number; rotationEnabled: boolean
    fileCount: number; buildCount: number
    createdAt: string; updatedAt: string
}
export type BundleDraft = {
    name: string; engine?: BundleEngine; categoryId?: string | null
    includedTags?: string[]; excludedTags?: string[]; buildTag?: string
    algorithm?: PackingAlgorithm; downscale?: number; rotationEnabled?: boolean
}
export type BundlePreview = { count: number; totalBytes: number; files: AssetFile[] }   // files capped at 50
export type BundleResolution = { uploadIds: string[]; relations: Array<{ parentUploadId: string; childUploadId: string; kind: AssetKind }> }
```

`contracts/errors.ts` adds `bundle_not_found`, `bundle_name_exists`, `bundle_name_required`,
`bundle_empty` (the build-time rejection lives in spec 04 but the code is declared here),
`unknown_build_tag`.

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/projects/:id/bundles` | `requireProjectMember` | — | `project_not_found` |
| POST | `/api/projects/:id/bundles` | `requireProjectPermission('bundle.write')` | `bundleSchema` | `bundle_name_required`, `bundle_name_exists`, `unknown_tag`, `unknown_build_tag`, `project_limit_reached`, `project_locked` |
| PATCH | `/api/projects/:id/bundles/:bundleId` | `requireProjectPermission('bundle.write')` | `{ ...bundleSchema, required: [] }` | `bundle_not_found`, `bundle_name_exists` |
| DELETE | `/api/projects/:id/bundles/:bundleId` | `requireProjectPermission('bundle.write')` | — | `bundle_not_found` |
| POST | `/api/projects/:id/bundles/preview` | `requireProjectMember` | `{ categoryId?, includedTags[], excludedTags[] }` | `project_not_found` |

The preview is a **POST on an unsaved rule**, not a GET on a bundle — the wizard previews before the row
exists. It returns a server-side `count` plus at most 50 sample rows; the browser never pulls the
project's whole file list to count locally.

`BundleService`

- `create/update` — validate every tag against `project_tags`, the build tag against
  `project_build_tags`, then `assertWithinProjectLimit(project, 'bundles_per_project')` on create.
  A bundle's `build_tag` is what a build **inherits on trigger** and can be overridden afterwards
  through the Manage Build Tag modal; if the tag has since left the project vocabulary, the trigger
  fails with `unknown_build_tag` rather than stamping a build with a channel that no longer exists.
- `preview(project, rule)` and `resolve(bundle)` share one SQL predicate so preview and build can never
  disagree:
  ```sql
  FROM assets f
  WHERE f.project_id = $1 AND f.upload_status = 'ready' AND f.deleted_at IS NULL
    AND ($2::text IS NULL OR f.category_id = $2)
    AND (cardinality($3::text[]) = 0 OR f.tags && $3)
    AND NOT (f.tags && $4)
  ```
- `resolve(bundle)` → `BundleResolution`: the matched files' `upload_uuid`s, plus one `relations` entry
  per child file (a file with both `parent_file_id` and `kind`) **whose parent is also in the set** —
  that array is what tells the realm "this normal map belongs to that texture".

Repository: `BundleRepository` (BaseRepository) — `listByProject` (with `fileCount`/`buildCount`
subquery counts, each filtering `deleted_at IS NULL`), `findById`, `create` →
`Result<Row, 'exists'>`, `update`, `softDeleteCascade` (returns `rows[0].c`), `preview`, `resolve`.

Side effects: audit `bundle.created` / `bundle.updated` / `bundle.deleted`. No notifications.

## Web

- `state/bundles.slice.ts` — `bundles`, `bundlesLoaded`, `preview`, `previewLoading`,
  `fetchBundles`, `createBundle`, `updateBundle`, `deleteBundle`, `previewRule(rule)` (debounced 250 ms
  in the module, not the slice). Create/delete refresh project usage.
- The wizard is one modal with a `tc-stepper`; step 3 re-runs `previewRule` whenever the query changes.
  The 250 ms debounce is the only throttle — no rate limit on `/preview`; if the GIN-backed query ever
  shows up in the slow-query log (`repositoryOptions` already warns at 250 ms) it gets one then.
- Every card shows its live `fileCount`, so a rule that currently matches nothing reads **0 files** on
  the card. Saving such a bundle is allowed (the rule may be aspirational); building it fails with
  `bundle_empty` (spec 04). The zero is visible before the click, which is what makes that split fair.
- Run Build calls the build slice's `runBuild(bundleId)` (spec 04) — one click from the list, no
  separate screen.
- Delete confirmation states *"All builds associated with this bundle will also be deleted."*
- Without `bundle.write` the card kebab and the header action are absent; Run Build additionally needs
  `build.run`.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Bundle card | `tc-section-card` | `specs/tc-section-card.md` | One per bundle; kebab in the `action` slot |
| Tag rule display | `tc-badge-row` | `specs/tc-badge-row.md` | `badges` JS prop — included/excluded tags as key/value chips |
| Card actions | `tc-action-items` | `specs/tc-action-items.md` | *Run Build* (`build.run`), *Edit* / *Delete* (`bundle.write`); `tc-action-click` |
| Wizard shell | `tc-modal` + `tc-stepper` | `specs/tc-modal.md`, `specs/tc-stepper.md` | `steps` JS prop, `active-step` attribute drives state |
| Step 1 — Basics | `tc-form-input`, `tc-card-options` | `specs/tc-form-input.md`, `specs/tc-card-options.md` | Name; engine as three cards (Phaser / PixiJS / Custom) |
| Step 2 — Query | `tc-extended-select`, `tc-tag-input` ×2 | `specs/tc-extended-select.md`, `specs/tc-tag-input.md` | Category (searchable, "All Categories" default); included and excluded tags with `recommendations` from `project_tags` |
| Step 3 — Preview | `tc-asset-row-list` + `tc-asset-row` | `specs/tc-asset-row-list.md`, `specs/tc-asset-row.md` | *"N files matched your query."*; `tc-spinner` while the count refreshes, `tc-empty-state` with *"No files match the current query. Adjust the category or tags."* |
| Step 4 — Advanced | `tc-select`, `tc-slider`, `tc-switch` | `specs/tc-select.md`, `specs/tc-slider.md`, `specs/tc-switch.md` | Algorithm; downscale % (slider constrained 1–100); allow rotation |
| Delete confirmation | `tc-confirm-dialog` | `specs/tc-confirm-dialog.md` | Danger confirm; body names the build cascade |

No new React component.

## Access policy

Read: any member. Create/edit/delete: `bundle.write`. Run Build from a card: `build.run`. Quota:
`bundles_per_project`, charged to the project owner (spec 07).

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `bundles` + indexes + Down entry);
`contracts/retention.ts` (E: `bundles: 'Bundles'`, default 0).

**api** — `contracts/bundles.ts` (C) + `contracts/index.ts` (E), `contracts/errors.ts` (E),
`schema/bundles.ts` (C), `repositories/bundles/sql/*.sql` (C: select-bundles, select-bundle,
insert-bundle, update-bundle, delete-bundle (CTE), preview-files, resolve-uploads, resolve-relations),
`repositories/bundles/BundleRepository.ts` (C), `conflicts.ts` (E),
`services/BundleService.ts` (C), `routers/bundleRouter.ts` (C),
`container.ts` (E), `http.ts` (E).

**web** — `types/bundles.ts` (C) + `types/index.ts` (E), `services/BundleService.ts` (C),
`state/bundles.slice.ts` (C) + `state/index.ts` (E), `configs/strings.ts` (E),
`modals/keys.ts` (E), `modals/BundleWizardModal.tsx` (C), `modals/index.tsx` (E),
`modules/ProjectBundles.tsx` (C), `pages/ProjectBundlesPage.tsx` (C), `Router.tsx` (E),
`modules/SidebarMenu.tsx` (E), `styles/modules/_bundles.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/bundles.md` (C) + `docs/index.md` (E).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. `curl -s -X POST localhost:6000/api/projects/$P/bundles/preview -b cookie -d '{"includedTags":["level1"],"excludedTags":["wip"]}' | jq '.data.count'`
   → matches a hand-counted `psql` query using the same predicate.
3. Create bundles past the plan limit → `400 project_limit_reached,bundles_per_project,…`.
4. Re-tag a file (spec 02) and re-run the preview → the count changes with no bundle edit.
5. Delete a bundle that has builds → builds and build files are soft-deleted in the same statement
   (`SELECT count(*) FROM builds WHERE bundle_id = … AND deleted_at IS NULL` → 0).
6. Browser: the wizard's step 3 refreshes as tags change and shows the empty-state copy for a rule that
   matches nothing; the saved card then reads **0 files**; a read-only member sees cards with no kebab.
7. Remove the bundle's build tag from the project vocabulary → spec 01 refuses the removal with
   `tag_in_use`, so a bundle can never point at a channel that stopped existing.

Extrude, padding and power-of-two stay **realm-side packer defaults**, not bundle columns — the four
advanced fields the proposal names are the whole surface, and every extra knob here is one the console
must then explain.
