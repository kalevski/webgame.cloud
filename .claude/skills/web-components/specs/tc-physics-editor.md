---
component: tc-physics-editor
---

### tc-physics-editor

Physics shape editor for polygons / circles / boxes drawn over an image background, with full undo/redo history. A slate toolbar carries the drawing tools (select / polygon / circle / box icon-buttons) plus auto-fit, undo, redo, and delete action buttons; below it a checkerboard canvas stage draws the background image (fit + centred) and the shape overlays with draggable vertex/handle markers. The **select** tool clicks a shape to select it and drags it (or its vertices / resize handles) to edit; **polygon** clicks to add vertices and closes on double-click, Enter, or a click on the first vertex; **circle** drags from centre to set the radius; **box** drags out a rectangle. The selected shape is emphasised in ink, live drawing previews in cyan. Keyboard: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` (or `Ctrl/Cmd+Y`) redo, `Delete`/`Backspace` removes the selected shape, `Enter` closes a polygon, `Escape` cancels it. The `alpha-threshold` attribute drives a best-effort auto-fit that derives a box from the image's opaque region. Every mutation (add / move / edit / delete / undo / redo / auto-fit) fires `tc-change` with the full shapes array. Sharp corners, slate neutrals, no status colour.

**Tag:** `tc-physics-editor`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string (URL) | — | Background image URL (string case of the `source` property) |
| `tool` | `select\|polygon\|circle\|box` | `select` | Active drawing tool |
| `alpha-threshold` | number | `1` | Alpha cutoff (0–255) used by the auto-fit helper to detect the opaque region |
| `disabled` | boolean | `false` | Disables all interaction (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `source` | `string \| File \| Blob \| null` | Background image. URL strings reflect to the `source` attribute; `File`/`Blob` are loaded via `URL.createObjectURL` |
| `shapes` | `PhysicsShape[]` | The shapes model (default `[]`). Setting it replaces the model, resets selection + history, and re-renders (no `tc-change`). A `PhysicsShape` is a polygon `{ type: 'polygon', points: { x, y }[] }`, a circle `{ type: 'circle', x, y, r }`, or a box `{ type: 'box', x, y, w, h }` (all coordinates in image pixels) |
| `onChange` | `(shapes: PhysicsShape[]) => void \| null` | Optional callback fired alongside `tc-change` |

**Methods:** `undo()`, `redo()`, `deleteSelected()`, `autoFit()`.

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ shapes: PhysicsShape[] }` | Fired whenever the shapes change — add, move, edit, delete, undo, redo, or auto-fit |

**No slots** — the element owns its canvas and toolbar.

```html
<tc-physics-editor tool="box" alpha-threshold="8"></tc-physics-editor>

<script>
  const editor = document.querySelector('tc-physics-editor')
  editor.source = 'sprite.png' // or a File / Blob
  editor.shapes = [
    { type: 'box', x: 60, y: 40, w: 220, h: 160 },
    { type: 'circle', x: 168, y: 124, r: 48 },
  ]
  editor.addEventListener('tc-change', (e) => {
    console.log(e.detail.shapes)
  })
</script>
```

---