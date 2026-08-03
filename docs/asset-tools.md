# Asset tools

Three console pages under the sidebar's **Tools** section turn existing assets (or nothing at all) into the
`TOOL_ONLY_KINDS` assets — `bitmap-font`, `bitmap-font-page`, `normal-map`, `physics` — that a plain upload
can never produce
(see asset-files.md, *Kinds*). Each page is a `ProjectPageShell` route
(`/projects/:id/tools/fonts`, `/projects/:id/tools/normal-maps`, `/projects/:id/tools/physics`) wrapping one
module, and each editor is a `@toolcase/web-components` canvas element that runs entirely client-side.

Every tool follows the same data path:

1. **Read the source** through the download ticket (`loadAssetBlob` → `GET
   /api/projects/:id/assets/:assetId/source` → fetch the realm URL) — the editor receives a `Blob`, never a
   cross-origin URL, so its canvas stays untainted.
2. **Edit locally** — nothing touches the API while drawing or generating.
3. **Save** through the ordinary upload flow (`saveToolAsset` → `UploadService.upload` with an explicit
   `kind` and optional `parentAssetId` → `PUT` to the realm → finalize), so tool output obeys the same
   quota, membership and `file.write` checks as any drop, appears in the Assets list, and travels into
   bundles with its parent.

Viewing a tool needs only membership; the Save button needs `file.write` and is replaced by a hint without
it.

## The editor shell (`components/ToolShell.tsx` + `components/ToolWorkspace.tsx`)

The three canvas elements ship **no chrome of their own** — each renders a bare `<canvas>` and reads its
whole configuration from attributes, exposing its actions as methods (`generate()`, `regenerate()`,
`clearPaint()`, `undo()`, `autoFit()`, …). The console owns every input, and all three tools wear the same
image-editor shell:

```
┌──────────────────────────────────────────────────────────┐
│ options bar — source picker · active-tool settings · ⚙⟲  │
├────┬──────────────────────────────────────┬──────────────┤
│ t  │                                      │ SURFACE PAINT│
│ o  │            canvas stage              │ ──────       │
│ o  │        (dark checkerboard)           │  active tab's│
│ l  │                                      │  controls    │
│ s  │                                      │              │
├────┴──────────────────────────────────────┴──────────────┤
│ status — tool · zoom · size · hint                       │
└──────────────────────────────────────────────────────────┘
```

`ToolWorkspace` renders that grid: a vertical **tool rail** of `tc-icon-button`s (`WorkspaceTool[]`,
restyled in `_tools.scss` as 36px rounded squares — the active one gets an accent tint plus a left
indicator bar; the variant stays constant so activation never re-renders the element), an **options bar**
whose fields change with the active tool — each field a hairline chip (`_tools.scss`; the inline-controls
container goes `display: contents` so chips flow beside the picker, whose `tc-extended-select` is blended
borderless into its chip through the `--bs-extended-select-trigger-*` vars) — plus right-aligned icon
**actions** (`WorkspaceAction[]`) grouped into one bordered cluster, the **stage**, the **dock** of panels, and the **status bar**. Pass `tools` to get the
rail; omit it and the grid drops that column. Under `$bp-lg` the dock moves below the stage. All three
canvas elements carry `fit-parent`, so they stretch to fill the stage track (`minmax(360px, 1fr)`, the
canvas wrapper stretched via `align-items: stretch` in `_tools.scss`) instead of using their fixed
`canvas-height` defaults.

`ToolShell` wraps that grid into the whole tool page, and is what the three modules actually render: an
optional `alerts` node on top, the **source picker** (a `picker` descriptor rendered as the first options-bar
field — label, `tc-extended-select` items, loading spinner), the `ToolWorkspace` grid, and a
`FloatingActionBar` carrying the **Asset name** field and Save (visible only with `file.write`; without it
a plain footer shows the no-write hint instead). The module supplies `canWrite`,
`defaultName` (the suggested output name), `saveDisabled`, an optional `hint` and `onSave(name)`; the shell
owns the name input (uncontrolled, committed on blur) and the saving flag, resolves the final name — the
typed one slugged through `baseName`/`slug` from `helpers/naming.ts`, or `defaultName` — and calls
`onSave` with it.

## The panels (`components/ToolControls.tsx`)

`ToolControls` is the store-agnostic panel renderer used inside the dock: a `tc-tab-bar` (size `sm`,
controlled through React state) across the top, one tab per `ToolSection`, with only the active section's
`ToolControl` descriptors rendered below it. `ToolInlineControls` renders the same descriptors as a
horizontal row — that is what the options bar uses, so a control reads the same whether it sits in the bar
or the dock. Eight control kinds cover the whole surface:

| Kind | Rendered as | Used for |
| --- | --- | --- |
| `slider` | `tc-slider` + a mono readout | every numeric attribute (sizes, offsets, thresholds, light position) |
| `toggle` | `tc-switch` | boolean attributes (`power-of-two`, `editable`, `invert-x`, `handles`) |
| `choice` | a segmented row of buttons | short enums that are switched constantly (active tool, fill type, preview mode) |
| `select` | `tc-select` | long enums |
| `color` | a native `<input type="color">` + hex readout | every colour attribute |
| `text` | a native uncontrolled `<input>`, committed on blur / Enter | free text (glyph set, preview text, asset name) |
| `textarea` | a native uncontrolled `<textarea>`, committed on blur | multi-line free text (currently unused) |
| `divider` | a labelled hairline rule | grouping related controls inside one tab (the outline group in *Fill & outline*) |

Two deliberate deviations from "always reach for a `tc-*` element": colours use the native input because
`tc-color-picker` re-renders its light DOM on every `value` assignment (it would close mid-pick and eat
keystrokes in its hex field), and free-text fields are uncontrolled for the reason in
`docs/known-problems/filter-input-loses-focus.md`. Text inputs remount on the panel's `revision` prop, which
is how *Reset settings* pushes defaults back into them.

Each module keeps one plain settings object in state and spreads it onto the element as kebab-case
attributes; nothing else holds tool state. The `FloatingActionBar` rendered by `ToolShell` — the
**Asset name** field and Save — is the only part of a tool page that talks to the API, through the module's
`onSave` callback.

## Font generator (`modules/FontGeneratorTool.tsx`)

`tc-bitmap-font-generator` rasterises a glyph atlas from any `font-family`. The picker
(`tc-extended-select`, first field in the options bar) lists the project's uploaded `font` assets first (kind
`font`, `ready`, ttf/otf) and the `SYSTEM_FONTS` catalog (`web/src/configs/fonts.ts`) after them. Picking
an uploaded font pulls its bytes, registers a `FontFace` named `tool-font-<assetId>` (cached per session)
and points the generator at it. There is no dropzone on the page — fonts are uploaded from the Assets page.

The element never generates by itself: the wand action in the options bar calls `generate()`, which fires
`tc-generate` with the PNG blob, the descriptor text and the atlas dimensions. Changing any setting flags
the last atlas out of date in the status bar, so nobody saves an atlas that no longer matches the preview.

The tool has no drawing tools, so its rail carries **Reset settings** followed by a separator (the rail
accepts `'separator'` entries in the `tools` array) and five **style presets** — Medieval, Sci-fi, Arcade,
Horror, Cartoon (`PRESETS` in the module). A preset overwrites the fill/outline/shadow/glow block
(`STYLE_RESET` first, so effects a preset doesn't use fall back to defaults), lights its button while
active, and deactivates on any manual style change; the dock panels then fine-tune it. The options bar holds
the font picker, glyph size and the preview text (preview-only, it never reaches the atlas; the other
preview knobs — zoom, alignment, padding, line gap — stay at the element's defaults, and the descriptor
always exports as XML, also the element's default); the dock holds *Fill & outline* (the fill-mode switch
shows only the solid colour or only the gradient controls, then a labelled `divider` control separates the
outline group), *Shadow & glow* (the drop-shadow controls, then the glow pair under its own divider) and,
last, *Font* — the character set as five toggles (uppercase letters, lowercase letters, digits, symbols,
emojis; `GLYPH_GROUPS` in the module, composed by `buildGlyphs` with a leading space) above a divider with
letter spacing, line height, glyphs per row and glyph padding. The default style is white glyphs with a
2px black outline. The atlas itself
is not configurable: it always exports at 1× scale, power-of-two dimensions and a transparent background
(`power-of-two` is hard-set on the element, `scale`/`background` left at their defaults).

Saving writes **two** assets, one after the other (`saveToolAsset` uploads the main file, then its
`attachment` with the freshly created asset as parent):

1. the descriptor — `{ fontFamily, format, descriptor, glyphs, width, height, page }` named
   `<font>-bitmap.json`, kind `bitmap-font`. Made from an uploaded font it carries `parentAssetId` = that
   font (a child, per `KIND_CHILDREN.font`); made from a system font it is a root `bitmap-font` asset.
2. the atlas texture — the generator's PNG named `<font>-bitmap-0.png`, kind `bitmap-font-page`, parented to
   the descriptor (`KIND_CHILDREN['bitmap-font']`). `page` in the descriptor is that file's name.

The PNG is **not** inlined as a data URL any more — the two files are separate bytes on the realm, so the
texture can be packed and served on its own, and the descriptor stays small. The pair is held together by
the parent link: the descriptor row shows `1 item` in the Assets list, and the page sits inside its
children modal.

## Normal maps (`modules/NormalMapTool.tsx`)

`tc-normal-map-generator` computes a tangent-space normal map from a picked `texture` asset (Sobel over a
luminance/alpha heightmap, brush-editable). The component fires `tc-generate` on every recompute; Save
uploads the latest output PNG as kind `normal-map` with the texture as parent — always a child, never
standalone (`parent_asset_required` server-side). One live normal map per texture is enforced by
`assets_normal_map_idx` (`normal_map_exists`); the module pre-warns and disables Save when the picked
texture already has one.

The rail opens with **Reset settings** and a separator, then the real tools: raise, lower, mask, pan, off.
Picking a painting tool also switches `editable` on, so choosing a brush is enough to start painting. The
options bar follows the rail — brush size / strength / falloff for raise and lower, brush size plus mask
colour and opacity for mask, zoom for pan — and always ends with the view switch (normal, texture, height,
lit, lit surface). Its actions are the element's own methods: Recompute, Clear painting, Clear mask, Reset
view.

The dock holds what is not per-stroke: *Surface* (normal strength, emboss height, bevel width, blur radius —
which follows the bevel until you move it — and the X/Y channel flips), *Painting* (the same brush values
plus the paint on/off switch) and *Light & output* — light tracking, light X/Y/height and ambient, then the
**working resolution** `max-dim` and zoom under an *Output* divider. `max-dim` caps the saved map and
defaults to 256 px in the element itself, so raising it is usually the first thing to do.

## Physics shapes (`modules/PhysicsShapesTool.tsx`)

`tc-physics-editor` draws polygons / circles / boxes, optionally over a picked `texture`. Save writes
`{ shapes }` as a JSON asset of kind `physics`: with a texture picked it becomes that texture's child
(`<texture>-physics.json`); with *No texture — free-hand shapes* it is a standalone asset
(`physics-shapes.json`).

The element reads its active tool from the outside, so the rail — Reset settings, a separator, then select,
polygon, circle, box, off — is what makes drawing possible at all. The options bar follows it: handles,
handle size and grab radius while selecting, snap grid and minimum shape size while drawing. Its actions
are Undo, Redo, Delete shape, Clear all, Cancel drawing and Auto-fit, each disabled from the element's own
`canUndo` / `canRedo` / `selectedIndex`, re-read after every `tc-change`. The dock adds *Drawing* (snap
grid and minimum size, then the handle fields, shortcut handling and undo depth under a *Handles &
snapping* divider) and *Auto-fit* (alpha cutoff, simplify tolerance, trace resolution, trace-on-load). The
status bar reports tool, shape count, selection and source. Without `file.write` the editor renders
`readonly`, the shape tools are disabled and so is the dock.

Every tool also takes an **Asset name** beside Save; leaving it empty keeps the derived name shown as the
field's placeholder.
