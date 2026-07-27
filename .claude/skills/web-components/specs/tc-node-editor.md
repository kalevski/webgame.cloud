---
component: tc-node-editor
---

### tc-node-editor

A framework-free canvas node/graph editor. Renders absolutely-positioned node boxes inside a transformable viewport (pan offset + zoom scale applied as a CSS transform) with an SVG overlay drawing bezier edges between ports, over a subtle hairline grid. Pan by dragging the empty canvas, zoom toward the cursor with the wheel (scale clamped 0.3–2.5), drag a node by its header to reposition it, click a node to select it (or empty background to clear), and drag from an output port onto another node's input port to create a connection (with a live cyan preview edge). Sharp corners; node header is a faint ink-gradient cap; a **selected** node gets ink border/header emphasis; ports are small circles. Nodes are keyboard-focusable — `Enter` selects, arrow keys nudge the selected node. `disabled` freezes all interaction. The editor frame is a panel (hairline border, no heavy shadow).

**Tag:** `tc-node-editor`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string (nullable) | — | Id of the highlighted node. Reflected as a JS property; patched in place (no full re-render). |
| `disabled` | boolean | `false` | Freezes all interaction (drag/pan/zoom/select) — opacity + `pointer-events: none`, announced via `aria-disabled`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `graph` | `GraphData` | `{ nodes: { id: string; label: string; inputs?: { id: string; label? }[]; outputs?: { id: string; label? }[] }[]; edges: { from: string; to: string; fromPort?: string; toPort?: string }[] }`. `from`/`to` are node ids; the optional `fromPort`/`toPort` pick a specific port anchor. Setting it re-renders. Defaults to `{ nodes: [], edges: [] }`. |
| `positions` | `Record<string, { x: number; y: number }>` | Maps node id → world position. Setting it re-positions the nodes. Unpositioned nodes auto-layout diagonally. |
| `selectedId` | `string \| null` | JS mirror of the `selected-id` attribute. |
| `onSelect` | `((id: string \| null) => void) \| null` | Optional callback mirroring `tc-select`. |
| `onMoveNode` | `((id: string, pos: { x: number; y: number }) => void) \| null` | Optional callback mirroring `tc-move-node`. |
| `onConnect` | `((from: string, to: string) => void) \| null` | Optional callback mirroring `tc-connect`. |

**Events** (each event also calls the matching callback property when set)

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string \| null }` | A node was clicked/selected, or the empty background was clicked (`id` is `null`). |
| `tc-move-node` | `{ id: string, pos: { x: number, y: number } }` | A node was dragged (fired on drag-end) or arrow-key nudged. |
| `tc-connect` | `{ from: string, to: string }` | The user dragged from a node's output port and released on another node's input port. |

**No slots** — all content is driven by the `graph`/`positions` properties.

```html
<tc-node-editor id="editor" selected-id="filter"></tc-node-editor>
<script>
  const el = document.querySelector('#editor')
  el.graph = {
    nodes: [
      { id: 'src', label: 'Source', outputs: [{ id: 'out', label: 'data' }] },
      { id: 'filter', label: 'Filter', inputs: [{ id: 'in' }], outputs: [{ id: 'ok', label: 'pass' }] },
      { id: 'sink', label: 'Sink', inputs: [{ id: 'in' }] },
    ],
    edges: [{ from: 'src', to: 'filter', fromPort: 'out', toPort: 'in' }],
  }
  el.positions = { src: { x: 40, y: 60 }, filter: { x: 280, y: 120 }, sink: { x: 540, y: 80 } }
  el.addEventListener('tc-select', e => console.log('select', e.detail.id))
  el.addEventListener('tc-move-node', e => (el.positions = { ...el.positions, [e.detail.id]: e.detail.pos }))
  el.addEventListener('tc-connect', e => console.log('connect', e.detail.from, '→', e.detail.to))
</script>
```

---