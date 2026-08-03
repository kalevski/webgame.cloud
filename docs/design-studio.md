# Design studio

A generator for marketing/social artwork — square posts, portrait and wide banners, pins, and vertical
video reels. Behind the `designs` product flag, which ships off.

The finished artefact is a **design**, not a "story": the same machinery produces a 1920×1080 banner or
a Pinterest pin, and only one of the five formats is actually called Story.

The idea it is built on: **a template is data, not code.** Nothing about a design lives in a React
component, so a member of staff adds a new layout without a deploy. This is a generic platform capability
in the same sense billing, notifications and webhooks are — it carries no game/build/asset-pipeline
framing, and it plugs into the project data source purely as one example of "fill a template from a
record you own."

Three tiers, and keeping them apart is the whole model:

| Tier | What it holds | Screen |
| --- | --- | --- |
| **Frame template** | one artboard: layers + the *fields* it leaves blank | *Frame templates* |
| **Video template** | an ordered list of frame templates, each with a duration and outgoing transition | *Video templates* |
| **Design** | one filled-in template: the actual words, the uploaded pictures, and the file it produced | *Designs* |

So "Launch announcement post" is a frame template with two text fields and an image field; "Autumn patch
notes post" is a design made from it, carrying the headline someone typed and the screenshot they
uploaded. The template is reusable; the design is the thing you publish. A design made from a **video**
template seeds one entry per frame, so the person filling it in is asked for every field across the whole
reel before recording.

**Creating a design asks which template to use.** The *New from frame template* / *New from video
template* buttons open `PickTemplateModal` — a list of the templates with their format and size, plus the
name for the new design.

## Key files

- Contract: `api/src/contracts/designs.ts` (`FrameTemplate`, `DesignLayer`, `DesignField`, `VideoTemplate`, `VideoFrame`, the `DESIGN_*` catalogs, `designLayerDefaults`, `designTotalMs`).
- API: `routers/designRouter.ts` → `services/DesignService.ts` → `repositories/designs/{FrameTemplateRepository,VideoTemplateRepository,DesignRepository}.ts`.
- Schema: `frame_templates`, `video_templates`, `video_template_frames`, `designs` in `migrations/sql/00001_schema.sql`; row types in `api/src/schema/designs.ts`.
- Web: `components/{DesignCanvas,DesignArtboard,EditorShell,EditorStage,EditorZoom}.tsx`, `hooks/useEditorShortcuts.ts`, `helpers/{designExport,designCss,zoom}.ts`, `state/designs.slice.ts`, `modules/{DesignStudio,FrameTemplateEditor,VideoTemplateEditor,DesignEditor}.tsx`, `pages/StudioPage.tsx`, `styles/modules/_studio.scss`.

## The model

A **frame template** owns a `format` (one of five sizes, `DESIGN_FORMAT_SIZES`: post, portrait, story,
wide, pin), a background colour, an ordered `layers[]` and a `fields[]`.

A **layer** is one of five kinds — `rect`, `ellipse`, `gradient`, `text`, `image` — in one flat shape
rather than a discriminated union, because the editor swaps a layer's kind in place and a union would
throw away every shared property on each swap. Geometry is **percentages of the canvas**, so a layout
survives a format change; `fontSize` is in canvas units (a `story` canvas is 1080×1920, so 84 means 84px
at export size).

A **field** is a slot the frame leaves blank: `{ key, label, kind, sample }`. A `text` or `image` layer
binds to one by key. At render time the value comes from the supplied values, then the field's `sample`,
then the layer's own static `text` — which is what makes a preview show something sensible before anyone
fills it in.

A **video template** is `video_template_frames` rows: a frame template reference, a position, a
duration, an outgoing transition and a `field_values` JSON blob. Reordering rewrites positions; the
service rewrites the whole child set inside one transaction, so a save is atomic.

Three deliberate limits, enforced in the service and mirrored in the JSON Schema:
`DESIGN_LAYER_LIMIT` 40, `DESIGN_FIELD_LIMIT` 20, `DESIGN_FRAME_LIMIT` 30.

## Two rules the format enforces

- **Every frame in a video must match the video's format.** Mixing a 1080×1080 frame into a 1080×1920
  reel would letterbox one of them, so the service rejects it with
  `design_format_mismatch,<frame>,<frameFormat>,<videoFormat>` and the composer only offers frames of the
  matching format once the first is picked.
- **A frame template in use cannot be deleted.** `frame_template_in_use,<count>` instead — otherwise the
  frame would vanish from the join and a saved reel would silently get shorter.

## Variables: a data-source registry, not a query box

A template field can be **bound to live data** (`field.source` + `field.sourceField`). The template
author picks `Project · Project name` from a dropdown; the person making a design picks *which* project,
and every field bound to that source fills at once.

The sources are declared in **code**, in `api/src/domain/designSources.ts` — the same registry shape this
repo uses for `ASSET_TYPES` (`docs/file-storage.md`) and `registerJobHandler` (`docs/background-jobs.md`).
Each one declares its `fields`, a `list(user)` and a `resolve(user, itemId)`.

This deliberately replaces the obvious alternative, a stored SQL query per template:

- **A query authored in the UI reads everything.** `users`, `sessions`, `api_keys`, and every other
  account's rows. "Read-only" does not fix that, and there is no way to express "only rows this caller
  owns" over arbitrary SQL.
- **A template outlives a column name.** A stored query breaks silently at the next rename; a resolver
  is typechecked and fails at build.
- **`resolve` goes through the normal services**, so ownership and permissions apply for free — the
  shipped resolver calls `ProjectService.list(user, false)`, exactly the same call a project screen would
  make.
- **The person filling in a design should not be writing SQL.** They pick a thing from a list.

Adding a source in a derived project is one entry in `DESIGN_SOURCES`. The shipped example resolves a
project to `name` / `description` / `appType` / `genre` / `memberCount` / `assetCount`.

Routes: `GET /api/studio/sources` (catalog), `/api/studio/sources/:id/items` (what you can pick),
`/api/studio/sources/:id/items/:itemId` (the resolved values).

## Saving a design as a file

*Save to files* rasterizes the artboard and posts the PNG to `POST /api/files` with asset type
`design_export`, then stores the returned id on the design. It goes through the **normal file-storage
port** (`docs/file-storage.md`), so a saved design lands wherever `design_export` is bound — local disk or
an S3 bucket — and inherits the admin binding UI and the download route with it. No second storage path.

Two consequences worth knowing: the action only appears with the `files` flag on and `file.upload`
granted, and with no source bound to `design_export` the upload answers
`asset_type_unassigned,design_export` rather than failing obscurely.

## Images are not stored

Frame templates store **layout and field definitions only**. An image field's content is supplied in
the browser per render (`fileToDataUrl` → a data URI) and never sent to the API. Two reasons, and the
second is the real one:

1. A 300KB photo is ~400KB of base64 in a JSON column, multiplied by every frame that uses it.
2. The point of a saved template is to aim it at *different* content next week. Freezing last week's
   photo into the layout is the wrong default.

The export path requires data URIs regardless: an SVG rasterized through `<img>` cannot fetch a
cross-origin image without tainting the canvas, and a tainted canvas cannot be read back to a PNG.

## Rendering and export

`DesignCanvas` renders the template as an in-DOM `<svg>` at full artboard size, CSS-scaled to fit. That
same node is what gets exported, so preview and output cannot drift.

- **Fonts must be system stacks** (`FONT_STACKS` — Helvetica / Georgia / ui-monospace). An SVG
  rasterized via `<img>` cannot fetch a webfont, so an `@font-face` family renders as a fallback in
  the PNG while looking correct on screen.
- Text wrapping is a greedy character-budget estimate (`AVERAGE_GLYPH_RATIO`) — SVG has no measurement
  API available before layout.
- **PNG**: serialize the node → `Image` → canvas → `toBlob`. `svgToImage` awaits `image.decode()`
  after `onload`, because `onload` fires when the SVG *document* parses, not when its embedded data
  URIs are drawable — drawing earlier paints blank on a cold cache.
- **Video**: `recordFramesToVideo` draws the timeline on a canvas and records `captureStream(30)` with
  `MediaRecorder`. Container is mp4 where the browser muxes it, else webm.

### Recording is real time, and that has a sharp edge

The recorder is driven by `requestAnimationFrame`, and **rAF does not fire in a hidden or fully
occluded tab** — so a backgrounded tab does not record slowly, it records nothing and the promise
never settles. The naive implementation leaves the button on "Recording…" forever.

Three guards, all in `helpers/designExport.ts`:

1. `document.visibilityState !== 'visible'` refuses up front.
2. Each warm-up frame wait races a `STALL_TIMEOUT_MS` watchdog.
3. The timeline loop records `lastFrameAt` and an interval rejects if no frame lands within the same
   window.

All three throw `DesignRecordingStalled`, which the composer renders as `strings.studio.recordStalled`
rather than a raw message. A `try/finally` stops the recorder and the stream on the failure path too,
so a stalled attempt does not leak a live capture track.

The warm-up before `recorder.start()` is load-bearing: every frame is drawn once so the browser
rasterizes them all up front, then the first frame is settled and two rAFs pass, so the capture track
opens on a painted keyframe. Without it the first recording of a session comes out corrupted and the
second — with a warm decode cache — is fine.

## Permissions, quota and routes

| Key | Gates |
| --- | --- |
| `design.template.read` | opening the studio and reading templates |
| `design.template.write` | creating, editing and deleting frame and video templates, and rendering designs from them |

Seeded so far only `maintainer` (and the reserved `owner`, which bypasses permissions entirely) holds
these — the studio ships as a staff-side tool for building marketing/social content, the same reach
`ticket.queue.*` has. A derived project that wants a paid tier to author or fill designs grants
`design.template.read`/`write` to that role's `SEED_ROLES` entry and mirrors it in the seed SQL
(`migration-patterns` skill); nothing else in the model assumes staff-only.

**Two quotas, because they grow at different rates.** `design_templates` counts frame plus video
templates together (`count-design-templates.sql`) — a small library someone curates. `designs` counts
renders (`count-designs.sql`) — content, which piles up fast. Putting them on one budget would mean a
month of posting locks you out of editing a template. Both are `ACCOUNT_LIMITED` resources
(`contracts/limits.ts`) with `INTERNAL_SOFT_CAPS` fallbacks of 500 / 5,000; no `role_limits` rows are
seeded for `maintainer`, so — like `ticket.queue.*` — the only role that currently holds the write
permission is unbounded. Each has its own meter in the page header and its own entitlement
(`DESIGN_TEMPLATE_LIMIT_ENTITLEMENT`, `DESIGN_LIMIT_ENTITLEMENT`) for the day a paid role is granted the
permission and needs a cap.

Everything is behind `requireAuth` **and** `requireFeature('designs')`, so with the flag off every
route answers 404 `feature_disabled,designs`.

Routes are grouped under `/api/studio`: `frames` and `videos` (the templates), `designs` (the filled-in
artefacts) and `sources` (the data registry), each with the usual five verbs. Ownership is the
authorization: a template is visible to its owner and to the reserved owner role (`canEditTemplate`).
Every mutation is audited (`create_frame_template`, `update_frame_template`, `delete_frame_template`,
`create_design`, `update_design`, `delete_design`, and the video trio), which makes each one a webhook
event for free.

## Web

`/studio` has two faces: a **library** and an **editor**, and they look nothing alike on purpose.

The library (`DesignStudio`) is an ordinary app screen — a `tc-rich-page-header` (title, description,
icon, the two quota meters in `slot="chips"`, the create buttons in `slot="actions"`) above `RouteTabs`,
then a card grid. Three tabs: *Frame templates*, *Video templates*, *Designs*. Cards are `tc-card` with
`slot="header"` / `slot="footer"`. One layout note: the card thumbnail letterboxes the artboard to a
fixed height (`svg { width: auto; height: 220px }`) — a 1080×1920 artboard rendered at full card width
made every card ~570px tall — over a checkerboard, so the letterbox reads as empty space rather than as
part of the artwork.

**A `tc-*` element gets exactly one stable child.** The card's meta line interpolates its badge and text
into a single string rather than rendering `{badge && <tc-badge/>}` beside a `<tc-text>`: these elements
re-parent their children into an inner wrapper, so a conditional sibling makes React delete a node it no
longer owns and the route dies with `NotFoundError: removeChild`.

### The editor is a mode, not a page

Picking *Edit* replaces the grid with `EditorShell` (`components/EditorShell.tsx`) — dark chrome,
toolbar, tool rail, canvas well, inspector, status bar. The shell owns **no editing state**; every
region is a prop, so the three editors share one frame:

| Region | Frame template | Design | Video template |
| --- | --- | --- | --- |
| Tool rail | the five layer kinds, click or drag onto the canvas | — | — |
| Canvas | editable artboard | read-only preview | the selected clip |
| Footer | — | frame strip (multi-frame designs) | the timeline |
| Inspector tabs | Layers · Layer · Fields · Fill · Setup | Fill · Fill from data · Output | Clip · Setup |
| Status bar | zoom, canvas size, layer count, shortcut hints | zoom, size, template | zoom, frame count, total duration |

It is styled with plain elements and one stylesheet (`styles/modules/_studio.scss`, the `.ed-*` block)
rather than `tc-*` components: the catalog is built for light surfaces and has nothing shaped like a
28px inspector row. Its colours are the app's own theme tokens (`--tc-surface`, `--tc-border`,
`--tc-text-muted`, the violet `$brand` accent) rather than a bespoke fixed palette, so the chrome now
follows the same light/system-dark behaviour as the rest of the app — it shipped from the source
template with a hardcoded dark palette and was retinted onto the shared tokens. The one exception is
the artboard itself, which stays literal white regardless of theme: it is the document being edited, not
app chrome, and it has to show the artwork's true colours the way a page does in any other design tool.
This editor still does **not** use the `tc-mobile-shell`/`tc-bottom-sheet` frame described in the
`mobile-first-app` skill — that is a layout-structure choice, unrelated to colour: it is a bespoke tool
chrome that predates that pattern in this feature and rearranges itself at `$bp-lg` on its own terms (see
below), the same way the reference implementation this was ported from built it.

Three type roles carry three kinds of information, and mixing them is what makes tool UI unreadable:
micro-caps for chrome labels, **tabular mono for every measured number** (so a coordinate does not
jitter while you drag it), and the body sans for user content.

### The binding thread

The thing this editor has that a generic image editor does not: a layer can be **bound to a field**, so
it is a blank someone fills in later. That state is one colour — amber — everywhere it appears at once:

- the selection box on the canvas turns dashed amber and grows a tag with the field's label;
- the row in *Layers* carries an amber chip with the same label;
- the matching row in *Fields* lights up while that layer is selected.

Selection itself stays violet. Two accents, each carrying a fact: violet is *what you picked*, amber is
*what is still blank*.

### Zoom and shortcuts

`EditorStage` (`components/EditorStage.tsx`) measures its own content box with a `ResizeObserver` and
sizes the artboard in real pixels — no CSS transform, so zooming past the viewport produces honest
scrollbars and `getBoundingClientRect()` stays the truth the pointer maths reads. It reports the fit
factor back, and the status bar shows `fit × zoom`, so 100% means artboard pixels the way it does in
every other editor.

`useEditorShortcuts` binds to the **window**, not a container, because a pointer drag on the canvas
moves focus; handlers are read through a ref so the one listener never closes over a stale layer. It
ignores events from inputs, selects and textareas.

⌘/Ctrl+S saves · ⌘/Ctrl+D duplicates · ⌘/Ctrl +/−/0 zooms · arrows nudge (Shift for larger steps) ·
Delete removes · Esc deselects.

### Phones get the same editor, rearranged

One breakpoint (`$bp-lg`) flips the shell rather than hiding half of it:

- the tool rail moves from a left column to a horizontally scrolling strip **below** the canvas, where a
  thumb reaches it;
- the inspector becomes a bottom dock. It is a grid row, not a modal sheet — the canvas stays live and
  visible while a slider moves, which is the whole point of an editor;
- opening the dock caps it at 46% of the editor (`:has(.ed-dock[data-open="true"])`), so the canvas keeps
  a floor and `EditorStage` simply refits;
- selecting a layer opens the dock on the *Layer* tab, so tapping a shape leads straight to its
  properties;
- format and background live in a *Setup* panel as well as the toolbar, because the toolbar drops its
  middle section below `$bp-md`;
- resize handles grow to 18px under `@media (pointer: coarse)`, and every control clears 44px.

`.ed` is a fixed-height box (`100dvh` minus the app chrome) with internal scrolling, deliberately not a
fullscreen overlay: the sidebar, the alert panel and the notification bell stay where the user left
them.

- **`FrameTemplateEditor`** — the canvas, the layer list, the property panel for the selected layer, the
  field definitions, a *Fill* panel that only feeds the preview, and *Download PNG*.
- **`DesignEditor`** — one input per field across every frame, the data-source pickers, and *Download
  PNG* / *Save to files* / *Download video*. Multi-frame designs get a frame strip under the canvas;
  every frame is also mounted off-screen, because video export needs all the SVG nodes at once.
- **`VideoTemplateEditor`** — a timeline where **each clip is as wide as it is long**, so the shape of
  the strip is the shape of the reel. Picking a clip previews it and opens its duration, transition and
  field values. The last clip shows no transition because nothing follows it. *Add frame* sits at the
  end of the timeline, where clips are added, not in a settings panel.

All three are seeded from their prop **once** and remounted by the parent with `key={template.id}`,
which is React's documented answer to "reset all state when a prop changes". That pattern trips
react-doctor's `no-derived-useState`, so it is suppressed for those three files in
`web/doctor.config.json` — the evidence is the `key` at the call site in `DesignStudio.tsx`.

### The canvas is an overlay, not the SVG

`DesignArtboard` renders the `<svg>` and, **on top of it**, an absolutely-positioned HTML box per
layer. Drag a box to move the layer, drag one of its eight handles to resize, drop a tool from the rail
to create one where you released it. Two reasons the interaction lives outside the SVG rather than on
the shapes:

1. **Export serializes the `<svg>` node alone**, so selection outlines and resize handles cannot leak
   into a PNG.
2. **SVG hit-testing is not box-shaped.** A `<text>` node is only "hit" on its glyphs, so dragging a
   short headline would mean chasing the letters; an HTML box is the rectangle the user sees.

Geometry is written back in percentages rounded to 0.1, and the numeric X/Y/W/H inputs stay in sync —
they are the same state.

### Custom CSS per layer

Each layer carries a `css` string applied as an **inline style on its SVG node**, which is what makes
it survive serialization into the PNG. `helpers/designCss.ts` parses the declarations and drops two
classes of value:

- anything containing `javascript:` or `expression(`;
- any `url(...)` that is not an in-document reference (`url(#glow)` is kept). A remote URL cannot be
  fetched by the rasterizer, so it would look right on screen and vanish in the export — and a
  same-origin one would taint the canvas and make `toBlob` throw.

Only properties SVG honours do anything: `filter`, `fill`, `stroke`, `mix-blend-mode` and the font
properties work; `box-shadow`, `border-radius` and layout properties are inert on a shape. The
equivalents are `filter: drop-shadow(...)` and the layer's own corner-radius control.

### Adding a contract field does not backfill jsonb

`layers` and `fields` are jsonb columns, so a row written before a `DesignLayer` key existed simply
lacks it — and the renderer then reads `undefined` where the type promises a string. `toFrameTemplate`
normalises on read through the same defaults the writer uses (`designLayerDefaults`), so an older row
heals the moment it is loaded rather than needing a data migration. Keep new `DesignLayer` fields in
`designLayerDefaults` and this stays true for the next one.

Number inputs go through a guarded parse (`toNumber` / `toDurationMs`): a cleared box yields `''` and
a half-typed one `NaN`, and either would put `NaN` into layer geometry and blank the artboard.
