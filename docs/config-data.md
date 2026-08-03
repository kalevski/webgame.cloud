# Game configuration data

In the console this lives as the **Live config** tool — under the sidebar's Tools section at
`/projects/:id/tools/live-config` (`pages/ConfigsPage.tsx`). It deliberately mirrors the other tools' save
flow (edits raise a `FloatingActionBar` with Discard / Save), but saving never writes an asset: a config is
a pointer the shipped game reads live, so Save publishes the values immediately, with no file and no
rebuild.

Three layers let a developer change a shipped game without rebuilding it:

- a **schema** defines the shape (`config_schemas.definition`, a `SchemaProperty[]`),
- a **config** is a named set of values against a schema — its `key` is what the game reads,
- **config versions** hold the values: one default per config, plus at most one per build tag.

Two partial unique indexes are the whole model: `config_versions_default_idx` (one default per config) and
`config_versions_tag_idx` (one version per `(config, build_tag)`). A build tagged `beta` therefore reads
the beta values automatically.

## Validation

`domain/configValidation.ts` inlines `ref` properties into one document before validating — resolution is
depth-limited to 5 and rejects cycles at save time (`schema_ref_cycle`), because a cyclic definition makes
the generated form non-terminating. Field errors ride in the response body; the machine-readable cause
carries only the count (`config_values_invalid,3`).

## The stale signal

`config_schemas.update_iterator` increments on every definition change. `configs.schema_update_iterator`
records what the config was last pulled forward to, and `schema.update_iterator > config.schema_update_iterator`
is the entire stale signal. **Update Schema** (`POST …/refresh-schema`) migrates stored values — dropping
removed keys, seeding added ones with defaults — and clears it.

A schema edit can break a live game between the save and the refresh: shipped clients keep reading current
values against a definition that has changed. That is why the refresh is explicit. It is a sharp edge, not
a bug.

`configs.schema_id` is `ON DELETE RESTRICT` — a schema in use cannot be deleted (`schema_in_use`).

Quota: `configs_per_project` counts `configs` rows only. Versions are free, and schemas are unlimited.


## Creating a schema

There is no create-schema modal. **New schema** on the configs screen calls `createSchema`, which POSTs a
schema named `Schema N` — the first N not already taken — with an empty definition, then selects it in the
editor for renaming and filling in. The schema list is the navigation; the editor is the form.

Composition is unchanged and now signposted in the UI: a property of type `ref` points at another schema in
the same project (`objectRefList` / `arrayRefList` on `tc-json-schema-def`, bounded by
`SCHEMA_REF_MAX_DEPTH`), which is how complex shapes are built from reusable ones.
