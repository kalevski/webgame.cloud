# Game configuration data

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
