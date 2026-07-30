# Live builds

The **Live** stage of the project pipeline is a real destination, not a filter on the builds screen. It is
deliberately **not in the sidebar** — the only way in is the `Live` step of `ProjectPipeline`, whose count is
**every passed build** (`status === 'pass'`), tagged or not.

| Screen | Route | Module |
| --- | --- | --- |
| All builds | `/projects/:id/live` | `modules/LiveBuilds.tsx` |
| One build | `/projects/:id/live/:buildId` | `modules/LiveBuildDetail.tsx` |

Both are rendered by one page (`pages/LiveBuildsPage.tsx`) that branches on the `:buildId` param, the same
shape the platform directories use.

## What a build froze

`BuildSnapshot` is written once, when the build is triggered (`BuildService.trigger`), and never updated. It
now carries three things:

- `bundle` — the whole `Bundle` as it stood at trigger time. Editing the bundle afterwards does not change
  what the build shipped, and the detail page says so.
- `configs` — `{ key, versionId, buildTag }` for every config that resolved for the build's build tag.
- `assets` — **new**: `{ id, name, kind, sizeBytes, tags }` for every asset that matched the bundle rule at
  that moment. Previously only the realm job payload knew this list and it was not persisted, so a build
  could not answer "what went into me". `trigger` fills it from `BundleService.preview` using the bundle's
  own rule.

Builds created before this change have no `assets` array (the field is optional); their detail page shows the
empty state for that section and everything else still works.

## The detail page

Four sections, all read from `GET /api/projects/:id/builds/:buildId` (`BuildDetail`):

1. **Metrics** — status, build tag, artefact size, trigger time.
2. **Bundle snapshot** — name, engine, included/excluded tags, packing algorithm as they were.
3. **Assets included** — the frozen input list.
4. **Packed output** — `BuildFile[]` the realm reported.
5. **Config for this build** — the configs scoped to this build's snapshot, edited through the same
   `tc-json-editor` + schema pairing the configs screen uses. The version being edited is the build's own
   build tag (falling back to `default` for an untagged build), so a build tagged `dev` edits the `dev`
   version and nothing else.

Config writes go through the existing `saveVersion` slice action and need `config.write` in the project
plane; without it the editor renders read-only.
