# Game configuration data

> Source: `proposal/06-config-data.md`. Shared decisions: [`README.md`](README.md).
> Depends on 01 (`config.write`, build-tag vocabulary), 04 (build tags bind versions to builds).

## Requirement

Three layers let a developer change a shipped game without rebuilding it: a **schema** defines the
shape, a **config** is a named set of values against a schema (its name is the key the game reads), and
**config versions** hold the values — one default per config, plus at most one per build tag. A build
tagged `beta` therefore reads the beta values automatically. Shipped games read through a **public,
unauthenticated** surface with explicit caching, IP rate limits, and project scoping in the query. An
**Update Schema** action lights up only when the schema has moved on since the config was created.

## Scope

- `config_schemas`, `configs`, `config_versions` with the two partial unique indexes that make the
  model work.
- Console CRUD for schemas, configs and versions; schema-validated saves; the stale-schema signal.
- The public read surface (`/api/public/...`) with per-route cache headers and rate limits.
- Config resolution for the build snapshot (consumed by spec 04).

## Non-goals

- No raw JSON textarea anywhere in the UI — values are edited through a generated typed form.
- No cross-project schema reuse; `ref` types resolve within one project.
- No config history/rollback beyond the version-per-tag model.
- No SDK package in this repo — the integrate drawer (spec 04) shows a snippet, nothing more.

## Data model

```sql
CREATE TABLE config_schemas (
    id              text PRIMARY KEY,
    project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            text NOT NULL,
    definition      jsonb NOT NULL DEFAULT '[]'::jsonb,
    update_iterator integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE UNIQUE INDEX config_schemas_name_idx ON config_schemas (project_id, lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE configs (
    id                     text PRIMARY KEY,
    project_id             text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schema_id              text NOT NULL REFERENCES config_schemas(id) ON DELETE RESTRICT,
    key                    text NOT NULL,
    description            text NOT NULL DEFAULT '',
    schema_update_iterator integer NOT NULL DEFAULT 0,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    deleted_at             timestamptz
);
CREATE UNIQUE INDEX configs_key_idx ON configs (project_id, lower(key)) WHERE deleted_at IS NULL;

CREATE TABLE config_versions (
    id         text PRIMARY KEY,
    config_id  text NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
    build_tag  text NOT NULL DEFAULT '',
    is_default boolean NOT NULL DEFAULT false,
    values     jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX config_versions_default_idx ON config_versions (config_id)
    WHERE is_default AND deleted_at IS NULL;
CREATE UNIQUE INDEX config_versions_tag_idx ON config_versions (config_id, build_tag)
    WHERE build_tag <> '' AND deleted_at IS NULL;
```

Those two partial unique indexes are the feature: **one default per config**, **one version per
(config, build tag)**. `configs.schema_id` is `ON DELETE RESTRICT` — a schema in use cannot be deleted
(`schema_in_use`); every other child is CASCADE-shaped and soft-deleted through the parent CTE.

`update_iterator` increments on every schema definition change. `configs.schema_update_iterator` records
what the config was last pulled forward to; `schema.update_iterator > config.schema_update_iterator` is
the entire stale signal.

Down order: `config_versions`, `configs`, `config_schemas`.

## Contracts

`contracts/configs.ts`:

```ts
export const SCHEMA_PROPERTY_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'ref'] as const

export type SchemaProperty = {
    key: string; type: SchemaPropertyType
    required?: boolean; defaultValue?: unknown
    enum?: string[]; ref?: string                  // ref = another schema id in the same project
    properties?: SchemaProperty[]; itemType?: SchemaPropertyType
}
export type ConfigSchema = { id: string; projectId: string; name: string; definition: SchemaProperty[]; updateIterator: number; usedByCount: number; createdAt: string; updatedAt: string }
export type ConfigSchemaDraft = { name: string; definition: SchemaProperty[] }

export type GameConfig = {
    id: string; projectId: string; schemaId: string; schemaName: string
    key: string; description: string
    schemaUpdateIterator: number; stale: boolean          // server-computed
    versions: ConfigVersionSummary[]
    createdAt: string; updatedAt: string
}
export type GameConfigDraft = { key: string; schemaId: string; description?: string }
export type ConfigVersion = { id: string; configId: string; buildTag: string; isDefault: boolean; values: Record<string, unknown>; updatedAt: string }
export type ConfigValidationError = { path: string; message: string }
export type PublicConfig = { key: string; values: Record<string, unknown>; buildTag: string; updatedAt: string }
```

`contracts/errors.ts` adds `schema_not_found`, `schema_name_exists`, `schema_in_use`,
`schema_required`, `schema_ref_cycle`, `config_not_found`, `config_key_exists`,
`config_values_invalid`, `config_version_not_found`.

Validation copy is **never** in the cause — `config_values_invalid` carries the count, and the field
errors ride in the response body as `ConfigValidationError[]` for the alert list.

## API surface

Console-facing:

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| GET | `/api/projects/:id/schemas` | `requireProjectMember` | — | `project_not_found` |
| POST | `/api/projects/:id/schemas` | `requireProjectPermission('config.write')` | `schemaSchema` | `schema_name_exists`, `invalid_body` |
| PATCH | `/api/projects/:id/schemas/:schemaId` | `requireProjectPermission('config.write')` | partial | `schema_not_found` |
| DELETE | `/api/projects/:id/schemas/:schemaId` | `requireProjectPermission('config.write')` | — | `schema_not_found`, `schema_in_use` |
| GET | `/api/projects/:id/configs` | `requireProjectMember` | — | `project_not_found` |
| POST | `/api/projects/:id/configs` | `requireProjectPermission('config.write')` | `configSchema` | `schema_required`, `config_key_exists`, `project_limit_reached` |
| PATCH | `/api/projects/:id/configs/:configId` | `requireProjectPermission('config.write')` | partial | `config_not_found` |
| DELETE | `/api/projects/:id/configs/:configId` | `requireProjectPermission('config.write')` | — | `config_not_found` |
| PUT | `/api/projects/:id/configs/:configId/versions/:tagOrDefault` | `requireProjectPermission('config.write')` | `{ values }` | `config_not_found`, `config_values_invalid`, `build_tag_unknown` |
| DELETE | `/api/projects/:id/configs/:configId/versions/:tag` | `requireProjectPermission('config.write')` | — | `config_version_not_found` |
| POST | `/api/projects/:id/configs/:configId/refresh-schema` | `requireProjectPermission('config.write')` | — | `config_not_found` |

Public (unauthenticated, **not enveloped** — each route carries `config: { envelope: false }`, D6):

| Method | Path | Cache-Control | Rate limit |
|--------|------|---------------|-----------|
| GET | `/api/public/projects/:id/assets?buildId=` | `public, max-age=31536000, immutable` | 20 rps / burst 100 per IP |
| GET | `/api/public/projects/:id/assets?buildTag=` | `public, max-age=60` | same |
| GET | `/api/public/projects/:id/configs/:key` | `public, max-age=0, s-maxage=30, stale-while-revalidate=60` | same |
| GET | `/api/public/projects/:id/configs?keys=a,b,c` | same | same (max 25 keys) |
| GET | `/api/public/builds/:id/config` | `public, max-age=60` | same |

A config from another project is **invisible, not forbidden** — the project id is part of the lookup, so
a mismatch is a 404 that reveals nothing. Values are deliberately **not inlined** into the asset
manifest; that is what keeps them live.

Config reads are **not** `no-store`. "Change a value without rebuilding" tolerates thirty seconds, and
`no-store` would put an origin hit on every game start; `s-maxage=30` with `stale-while-revalidate`
keeps the promise while letting a CDN absorb the traffic.

**The public surface does not use the DB-backed limiter.** `rate_limits` is an upsert per request —
one Postgres write per player per fetch, which is exactly the traffic shape this surface has. Public
routes get an in-process token bucket (per IP, 20 rps / burst 100, memory-only, per instance) plus a
short in-process response cache keyed `(projectId, key, buildTag)` with the same 30 s life as the
header. The DB-backed limiter stays where it belongs: the write surface, including the waitlist POST
(spec 08). This is stated in `docs/platform-hardening.md` beside the existing limiter so the two are
not confused.

`?buildId=` promises `immutable`, and a build can still be deleted or purged: a purged build's manifest
returns 404 and the promise applies only for as long as the build exists. That caveat is in
`docs/game-runtime-api.md` — a game pinned to a build id must treat a 404 as "re-resolve by tag".
The manifest **handler** belongs to spec 04 (its content is `build_files`); this spec owns the router,
the cache policy and the rate limiting.

`ConfigService`

- `saveVersion(project, config, tagOrDefault, values)` — resolves the schema, validates values against
  the definition (`domain/configValidation.ts`, reusing the `JSONSchema` validator from `@toolcase/base`
  rather than a hand-rolled walker), and upserts the version row. Opening a tag with no override
  **pre-fills from the default** on read, so the client is always editing a copy; saving creates the row.
  `ref` properties are **resolved and inlined into one JSON Schema before validation** — the validator
  has no cross-document `$ref` resolution and does not need one when the graph is project-local.
  Resolution is depth-limited to **5** and rejects cycles at save time (`schema_ref_cycle`), because a
  cyclic definition makes the generated form non-terminating.
- `refreshSchema(config)` — sets `schema_update_iterator = schema.update_iterator`, migrating stored
  values (drop removed keys, seed added keys with defaults) in one transaction.
- `resolveForBuildTag(projectId, buildTag)` — used by spec 04's snapshot and by the public read:
  the tag version if present, else the default.
- `publicRead(projectId, keys)` — one query, no user context, `deleted_at IS NULL` at every level.

`ConfigRepository` (BaseRepository) verbs return `Result<Row, 'exists'>` on the three unique indexes;
`upsertVersion` repeats the partial-index predicate in its `ON CONFLICT` clause
(`ON CONFLICT (config_id, build_tag) WHERE build_tag <> '' AND deleted_at IS NULL DO UPDATE SET …,
deleted_at = NULL, updated_at = now()`), so a soft-deleted version revives instead of colliding.

Side effects: audit `config.created` / `config.updated` / `config.version_saved` / `config.deleted` and
`schema.*`. No notifications — a config edit is expected to be frequent and low-drama. Public reads are
never audited (they are unbounded traffic; the rate limiter is the record).

**A schema edit can break a live game between the save and the refresh.** `update_iterator` moves,
the config goes stale, but shipped clients keep reading the *current values* against a definition that
has changed — which is exactly why `refreshSchema` is an explicit action and not automatic. It is a
sharp edge, not a bug, and `docs/config-data.md` says so in those words.

`TABLE_LABELS` gains `config_schemas`, `configs` and `config_versions`, all at the `0` default (D10).

## Web

- `state/configs.slice.ts` — `schemas`, `configs`, `activeConfig`, `versionDraft`, `validationErrors`,
  plus `fetchSchemas`, `saveSchema`, `deleteSchema`, `fetchConfigs`, `createConfig`, `saveVersion`,
  `deleteVersion`, `refreshSchema`. Create/delete refresh project usage (`configs_per_project`).
- The page has **Configs** and **Schemas** tabs. **Add is disabled until at least one schema exists** —
  the one place in this codebase where a disabled control is right, because the fix (create a schema) is
  on the adjacent tab and stated in the helper text.
- Inside a config, the tab strip is **Default** followed by one tab per project build tag; tags that
  already have an override are marked with a trailing dot (`release ●`).
- Edits are batched behind Save / Discard with the unsaved-changes guard, and the default tab is
  validated against the schema on save.
- **Update Schema** appears in the header only while `config.stale`.

## UI component map

| UI element | Component | Source | Key props/events |
|---|---|---|---|
| Configs / Schemas switch | `tc-tab-bar` | `specs/tc-tab-bar.md` | `tabs` JS prop |
| Schema property editor | `tc-json-schema-def` | `specs/tc-json-schema-def.md` | `label` (editable name), `default-value` JSON string, `refList`/`arrayRefList`/`objectRefList` JS props from the project's other schemas; `tc-change` → `{ value }` (serialized), `tc-label-change` |
| Config version tabs | `tc-tab-sections` | `specs/tc-tab-sections.md` | `items` JS prop (`key`,`label`,`content`); controlled via `active-key`; the `●` marker goes in the label |
| Config value editor | `tc-json-editor` | `specs/tc-json-editor.md` | `schema` attribute = `JSON.stringify(definition)`, `value` JS prop, `tc-change` → `{ value }`. Switches for booleans, groups for objects, `#1`/`#2` array headers — no raw JSON box |
| Validation errors | `tc-alert` | `specs/tc-alert.md` | `variant="danger"`, one line per error as `<path>: <message>` |
| Stale-schema signal | `tc-badge` + `tc-action-header` | `specs/tc-badge.md`, `specs/tc-action-header.md` | *Update Schema* action present only while stale |
| Add / Save / Discard / Delete | `tc-action-header` | `specs/tc-action-header.md` | All gated on `config.write`; **Add** carries `disabled` until a schema exists |
| Empty states | `tc-empty-state` | `specs/tc-empty-state.md` | Distinct copy for "no schemas yet" vs "no configs yet" |

No new React component — `tc-json-schema-def` and `tc-json-editor` are exactly this feature.

## Access policy

Console read: any project member. Console write: `config.write`. Public read: **nobody is
authenticated** — the surface is deliberately credential-free, protected by project-scoped lookups and
DB-backed per-IP rate limits (`rate_limits` table, same mechanism as the other abusable routes).
Quota: `configs_per_project` (spec 07), counting `configs` rows only — versions are free, because a
per-tag override is the feature, not a resource. Schemas are unlimited.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: three tables, four indexes, Down entries).

**api** — `contracts/configs.ts` (C) + `contracts/index.ts` (E), `contracts/errors.ts` (E),
`domain/configValidation.ts` (C), `schema/configs.ts` (C),
`repositories/configs/sql/*.sql` (C: select-schemas, insert-schema, update-schema, delete-schema,
select-configs, select-config, insert-config, update-config, delete-config, select-versions,
upsert-version, delete-version, resolve-for-tag, public-read), `repositories/configs/ConfigRepository.ts` (C),
`conflicts.ts` (E), `services/ConfigService.ts` (C), `contracts/retention.ts` (E: three labels),
`routers/configRouter.ts` (C), `routers/publicGameRouter.ts` (C — the unauthenticated surface),
`http/envelope.ts` (E: honour `config.envelope === false`), `http/publicRateLimit.ts` (C — the
in-process token bucket + response cache), `container.ts` (E), `http.ts` (E).

**web** — `types/configs.ts` (C) + `types/index.ts` (E), `services/ConfigService.ts` (C),
`state/configs.slice.ts` (C) + `state/index.ts` (E), `configs/strings.ts` (E),
`modals/keys.ts` (E), `modals/CreateConfigModal.tsx` (C), `modals/index.tsx` (E),
`modules/ProjectConfigs.tsx` (C), `modules/SchemaEditor.tsx` (C),
`pages/ProjectConfigsPage.tsx` (C), `Router.tsx` (E), `modules/SidebarMenu.tsx` (E),
`styles/modules/_configs.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/config-data.md` (C), `docs/game-runtime-api.md` (C — the public surface, its caching
and the envelope exception) + `docs/index.md` (E), `docs/platform-hardening.md` (E: the public rate
limits).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. Create a schema, then a config; try a second config with the same key → `409 config_key_exists`.
3. Save the default version, then a `beta` version. `psql` check: exactly one row with `is_default`,
   one per `(config_id, build_tag)`; inserting a duplicate by hand raises a unique violation.
4. `curl -si 'localhost:6000/api/public/projects/$P/configs/difficulty'` → **no envelope** (`{"key":…}`
   at the top level) and `Cache-Control: public, max-age=0, s-maxage=30, …`. Same key with a wrong
   project id → 404. `curl -s localhost:6000/api/public/constants | jq '.status'` → still `"OK"`: the
   envelope opt-out is per route, not per prefix, and the console's own public endpoint keeps it.
5. Edit a value in the console and re-curl without any rebuild → the new value is served immediately.
6. Change the schema definition → the config shows the stale badge and **Update Schema**; press it →
   values are migrated and the badge clears.
7. Hammer the public endpoint past 20 rps → `429 rate_limited`, the console surface stays unaffected,
   and `SELECT count(*) FROM rate_limits` does **not** move — public traffic never touches the table.
8. Save a schema that references itself → `schema_ref_cycle`, nothing written.
9. Try to remove a build tag from project settings while a config version is bound to it → spec 01
   refuses with `tag_in_use`, so a version can never be orphaned from its channel by a settings edit.
