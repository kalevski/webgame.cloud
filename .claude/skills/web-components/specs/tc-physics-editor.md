---
component: tc-physics-editor
---

### tc-physics-editor

Canvas-only physics shape editor for polygons / circles / boxes drawn over an image background, with full undo/redo history. **The element renders no chrome** — no tool buttons, no undo/redo/delete/auto-fit buttons: it owns a single checkerboard canvas stage that draws the background image (fit + centred) and the shape overlays with draggable vertex/handle markers. The active tool is the `tool` attribute; the actions are imperative methods. `tool="select"` clicks a shape to select and drag it (or its vertices / resize handles); `tool="polygon"` clicks to add vertices and closes on double-click, Enter, or a click on the first vertex; `tool="circle"` drags from centre to set the radius; `tool="box"` drags out a rectangle; `tool="none"` makes the canvas inert. Drawn/edited points snap to the `snap` grid when set. The selected shape is emphasised in ink, live drawing previews in cyan. Keyboard (unless `shortcuts="off"`): `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` (or `Ctrl/Cmd+Y`) redo, `Delete`/`Backspace` removes the selected shape, `Enter` closes a polygon, `Escape` cancels it. `autoFit()` traces the image's opaque silhouette into a simplified polygon (`alpha-threshold`, `simplify-tolerance`, `max-alpha-dim`). Every mutation (add / move / edit / delete / clear / undo / redo / auto-fit) fires `tc-change` with the full shapes array. Sharp corners, slate neutrals, no status colour.

**Tag:** `tc-physics-editor`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string (URL) | — | Background image URL (string case of the `source` property) |
| `shapes` | JSON string | — | Initial shapes model as a JSON array (input only — it is never written back; read the model via the property/event) |
| `tool` | `select\|polygon\|circle\|box\|none` | `select` | Active drawing tool |
| `canvas-width` | CSS length | `100%` | Drawing-canvas width (bare numbers are px, e.g. `480`; `%` / `vw` / `calc()` pass through) |
| `canvas-height` | CSS length | `320px` | Drawing-canvas height (bare numbers are px). Under `fit-parent` it becomes the minimum height |
| `fit-parent` | boolean | `false` | Auto-scale: the element and canvas stretch to fill the parent box instead of using `canvas-height`. Give the parent a definite height (`height`, grid/flex track, `aspect-ratio`); where it has none, `canvas-height` is the floor |
| `handle-size` | number | `8` | Drawn vertex/resize handle size in CSS px |
| `handle-hit` | number | `9` | Pointer grab radius for handles in CSS px |
| `min-size` | number | `4` | Smallest accepted extent (image px) for a freshly drawn circle/box |
| `snap` | number | `0` | Grid step (image px) that drawn/edited points snap to; `0` disables it |
| `handles` | `on\|off` | `on` | `off` hides the handles and disables grabbing them |
| `shortcuts` | `on\|off` | `on` | `off` disables the keyboard bindings |
| `history-limit` | number | `0` | Maximum undo/redo snapshots kept; `0` = unlimited |
| `alpha-threshold` | number | `1` | Alpha cutoff (0–255) marking a pixel opaque for `autoFit()` |
| `simplify-tolerance` | number | `1.5` | Douglas-Peucker tolerance for the auto-fit silhouette trace |
| `max-alpha-dim` | number | `512` | Resolution cap (longest edge) for the alpha raster used by `autoFit()` |
| `auto-fit` | boolean | `false` | Runs `autoFit()` once as soon as a source image finishes loading |
| `readonly` | boolean | `false` | View-only: shapes still render, editing is off, no dimmed look |
| `disabled` | boolean | `false` | Disables all interaction (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `source` | `string \| File \| Blob \| null` | Background image. URL strings reflect to the `source` attribute; `File`/`Blob` are loaded via `URL.createObjectURL` |
| `shapes` | `PhysicsShape[]` | The shapes model (default `[]`). Setting it replaces the model, resets selection + history, and re-renders (no `tc-change`). A `PhysicsShape` is a polygon `{ type: 'polygon', points: { x, y }[] }`, a circle `{ type: 'circle', x, y, r }`, or a box `{ type: 'box', x, y, w, h }` (all coordinates in image pixels) |
| `selectedIndex` | `number` | Index of the selected shape, or `-1`; writable |
| `canUndo` / `canRedo` / `canAutoFit` | `boolean` (read-only) | State for driving your own toolbar buttons |
| `onChange` | `(shapes: PhysicsShape[]) => void \| null` | Optional callback fired alongside `tc-change` |

Every attribute above also has a matching camelCase property (`tool`, `canvasWidth`, `canvasHeight`, `fitParent`, `handleSize`, `handleHit`, `minSize`, `snap`, `handles`, `shortcuts`, `historyLimit`, `alphaThreshold`, `simplifyTolerance`, `maxAlphaDim`, `autoFitOnLoad`, `readonly`, `disabled`).

**Methods:** `undo()`, `redo()`, `deleteSelected()`, `clear()`, `cancelDrawing()`, `autoFit()`.

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ shapes: PhysicsShape[] }` | Fired whenever the shapes change — add, move, edit, delete, clear, undo, redo, or auto-fit |

**No slots, no controls** — the element owns exactly one canvas; build your own toolbar around it.

```html
<tc-physics-editor tool="box" alpha-threshold="8" snap="2" history-limit="50"></tc-physics-editor>

<script>
  const editor = document.querySelector('tc-physics-editor')
  editor.source = 'sprite.png' // or a File / Blob
  editor.shapes = [
    { type: 'box', x: 60, y: 40, w: 220, h: 160 },
    { type: 'circle', x: 168, y: 124, r: 48 },
  ]
  // Your own toolbar drives the element:
  document.querySelector('#polygon').onclick = () => (editor.tool = 'polygon')
  document.querySelector('#undo').onclick = () => editor.undo()
  document.querySelector('#autofit').onclick = () => editor.autoFit()
  editor.addEventListener('tc-change', (e) => {
    console.log(e.detail.shapes, editor.canUndo)
  })
</script>

<!-- read-only view of a stored model -->
<tc-physics-editor readonly handles="off" shapes='[{"type":"circle","x":80,"y":80,"r":40}]'></tc-physics-editor>

<!-- fixed canvas box, then auto-scaled to a sized parent -->
<tc-physics-editor canvas-width="520" canvas-height="400"></tc-physics-editor>

<div style="height: 70vh">
    <tc-physics-editor fit-parent canvas-height="240"></tc-physics-editor>
</div>
```

---