# Builds — packaging a bundle for delivery

> Turning a bundle into a published, versioned artefact.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What the user does

Press build on a bundle and land on the Builds screen. It is **not a table** — builds are grouped
into a collapsible section per bundle, each with a **Build now** action, above a row of status filter
chips (**All / Passed / Failed / Running / Queued**) and a **Purge builds** button. The helper line
states the model outright: *"Builds are grouped by bundle. Tag important builds to protect them from
purges."*

The statuses are renamed on the way out of the database — `pending → queued`, `running → running`,
`done → pass`, `failed → fail`.

When a build passes, the user can download the bundle and its manifest and see the per-file list of
what it produced, grouped under friendly headings — **Textures / Audio / Text / Configs / Fonts /
Locales / Dialogues**.

**Both the list and the detail page update live**, polling every 2500 ms while any visible build is
`queued` or `running` and stopping on their own once everything settles. A screen whose job is
watching something finish has to actually show it finishing.

Status uses one vocabulary everywhere — **Queued / Running / Passed / Failed** — on the filter chips,
the list rows and the detail badge alike. Rows pair the status icon with its label so colour is never
the only signal.

## Build tags — the publish-channel mechanic

A build can be given a **build tag** (`production`, `beta`, whatever). Two rules make this useful:

1. **A tag is unique per bundle.** Setting a tag on a build clears it from its sibling first, in one
   transaction. So `production` always points at exactly one build — moving the tag is how you
   promote and how you roll back.
2. **Purge deletes every untagged build** (`DELETE /projects/:id/builds`). Tagging is therefore also
   how a user *protects* a build from cleanup.

Build tags are also the key that live configuration resolves against (see *Game configuration data*), so tagging a build is
what binds it to a set of config values — and the key the SDK loads by.

The **Manage Build Tag** modal handles the exclusivity rule gracefully: each tag card reads either
*"Available"* or *"Currently on build `<hash>`"*, and selecting a taken one shows *"Tag `release` will
be moved from build `a3f9c1e` to this build."* Stealing a tag is allowed and pre-announced — exactly
right for a promotion mechanic. The picker lists the **project's own build tags**, defined in project
settings.

Each build also has a **How to integrate** drawer — copy-buttons for the Project ID and the build
reference, labelled *"Build tag (preferred)"* over the build ID, plus an SDK snippet. It is a small
thing that closes the loop between "I built something" and "my game loads it", and it is why build
tags matter to the user rather than just to the system.

Deleting a single build asks for a plain confirmation. Type-to-confirm is reserved for actions that
destroy a whole project or a set of them — including **Purge builds**, which names how many untagged
builds will go.

## What is frozen at build time

Triggering a build writes a **snapshot** into the build row: the bundle's settings *and* the resolved
config versions at that moment. That snapshot is the traceable record of exactly what shipped —
config values can be edited afterwards, but which *version* the build referenced cannot drift.

## The pipeline, end to end

1. **Trigger** — API resolves configs for the bundle's tag, writes the snapshot, and inserts a
   `pending` build **pinned to the realm that hosts this project**.
2. **Claim** — the build machine long-polls `POST /realm/jobs/next`. The API flips the oldest pending
   build for that realm to `running` using `FOR UPDATE SKIP LOCKED` and hands back
   `{jobId, kind: 'asset_bundle:generate', payload: {projectId, bundleId, uploadIds, relations}}`.
3. **Progress** — the worker posts `started` / `in_progress`; both collapse to `running`. Terminal
   statuses posted to the *status* endpoint are deliberately **ignored** so they can never write a
   value outside the allowed set.
4. **Result** — the worker posts to `/jobs/:jobId/result`. `fulfilled → pass`, `rejected → fail`.
   This endpoint is the **sole owner of terminal transitions**. It writes the artefact URLs, the
   hashes, the size, and one row per output file — replacing any prior rows, so a retry is idempotent.

## Why this is the biggest piece of work

"Packaging a bundle" is not zipping files. The job is an asset pipeline:

- **Texture packing** into spritesheets (`max-rects` by default, padding 2, 4096×4096, up to 8 pages,
  fixed deterministic sort), honouring the bundle's downscale/rotation/extrude/power-of-two settings.
- **Normal-map compositing** — children excluded from the diffuse packer and drawn onto a parallel
  page at *identical coordinates*. Subtle and easy to get wrong.
- **Audio spritesheets** — concatenated via `ffmpeg` (44.1 kHz stereo, silence gaps, `m4a` default)
  plus a JSON index of `{start, end}` offsets.
- **A deterministic ZIP** — inputs sorted, `date` epoch, mode `0644`, so identical inputs always
  produce a byte-identical archive — plus a manifest, published to Cloudflare R2.

Both `sharp` and `ffmpeg` are treated as **optional**: absent → a warning and empty results, never a
failed build. That is what makes local development possible without native binaries.

---

## Screens & components

Screen: **Builds — `/projects/:id/builds`**

```
pages/FooPage.tsx      route shell — page title, auth guard, layout wrapper
  └ modules/Foo.tsx    the screen — selectors, actions, modals, tc-* elements
      └ state/foo.slice.ts   fetch/mutate, alerts
          └ services/FooService.ts   one method per endpoint
```

These four rules apply to every screen:

- **Gate reads and writes separately.** The page renders for any project member; each write control is
  wrapped in the matching permission check. A read-only member must never see a dead button — drop the
  entry from a `tc-action-header` `actions` array rather than disabling it, and swap an actionable
  `tc-action-row-list` for a plain `tc-data-list`.
- **Boolean props need `value || undefined`** so the attribute is absent when off.
- **Object props and custom events go through `useTc<HTMLElement>(props, events)`** — assign the
  returned ref. Anything set via a JS property (`options`, `items`, `steps`, `usage`, `tabs`, `states`,
  `badges`) is passed this way, not as an attribute.
- **`tc-advanced-table` body rows are a trusted HTML string** fed through `rows`, never React children —
  escape every interpolated value, and handle clicks with one delegated handler on the module root.

Read the matching component spec before using a `tc-*` element; attribute names and event payloads are
per component.

| Region | Component | Notes |
| --- | --- | --- |
| Status filter | `tc-chip-group` | All / Passed / Failed / Running / Queued; `items` JS property |
| Per-bundle grouping | `tc-group` | Badge shows the build count; header action triggers *Build now* |
| Build row | `tc-build` | Purpose-built: name, date, size, duration, status icon, optional badge, kebab |
| Purge | `tc-action-header` | Needs `build.run`; confirm modal warns tagged builds survive |
| Build progress (detail) | `tc-state-machine` | `states` JS property — queued → running → pass/fail with done/active/error markers |
| Build metadata | `tc-badge-row` | Hash, size, duration as key/value chips |
| Output files | `tc-group` + `tc-asset-row-list` | Grouped Textures / Audio / Text / Configs / Fonts |
| Integrate panel | `tc-drawer` + `tc-code-snippet` | The snippet element ships its own copy button and language label |
| Manage build tag | `tc-modal` + `tc-card-options` | Each card reads *Available* or *Currently on build `<hash>`*; `tc-alert` warns when a tag will be moved. Populate from the **project's own** build tags, not hardcoded suggestions |

One status vocabulary everywhere, and the **list** polls as well as the detail page.
