---
component: tc-level-select
---

### tc-level-select

Level / stage selection grid with SVG edge connections between nodes. Each node can be locked, completed, or selected; optional star ratings show best performance. Flat slate aesthetics: sharp corners, 1px hairline borders, ink accent for the selected state, JetBrains Mono for node labels.

**Tag:** `tc-level-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | `""` | ID of the currently selected node. Setting re-renders with the new selection. Cleared with an empty string or `removeAttribute`. |
| `width` | number | `600` | Canvas width in pixels. |
| `height` | number | `360` | Canvas height in pixels. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `selectedId` | `string` | Reflects the `selected-id` attribute. |
| `width` | `number` | Reflects the `width` attribute. |
| `height` | `number` | Reflects the `height` attribute. |
| `nodes` | `LevelNode[]` | Array of level nodes. Setting re-renders the whole grid. |
| `edges` | `LevelEdge[]` | Array of edges between nodes. Setting re-renders the grid. |
| `onSelect` | `((detail: { id: string }) => void) \| null` | Optional callback, fires alongside `tc-select`. |
| `onConfirm` | `((detail: { id: string }) => void) \| null` | Optional callback, fires alongside `tc-confirm`. |

**`LevelNode` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique identifier for this node. |
| `x` | `number` | yes | X coordinate (node center). Used for positioning and as SVG edge endpoint. |
| `y` | `number` | yes | Y coordinate (node center). Used for positioning and as SVG edge endpoint. |
| `label` | `string` | no | Optional short label rendered below the glyph in JetBrains Mono. |
| `icon` | `string` | no | Optional Lucide icon name (kebab-case, e.g. `"play"`, `"skull"`). |
| `locked` | `boolean` | no | Locks the node — not interactive, rendered at reduced opacity. |
| `completed` | `boolean` | no | Marks the node as completed (success border + check glyph when no icon set). |
| `stars` | `number` | no | Maximum star count for this node (default `3`). Stars row only shown when `bestStars` is also set. |
| `bestStars` | `number` | no | Achieved star count. When set, a star row is rendered below the label. |

**`LevelEdge` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `string` | yes | ID of the source node. |
| `to` | `string` | yes | ID of the target node. An edge is styled `--completed` only when both nodes are completed. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string }` | Fired when an unlocked node is clicked or activated by keyboard (Enter / Space). Bubbles and is composed. |
| `tc-confirm` | `{ id: string }` | Fired when an unlocked node is double-clicked. Bubbles and is composed. |

**Slots**

None. `tc-level-select` is entirely data-driven via JS properties and attributes.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-level-select-bg` | `var(--tc-surface)` | Canvas background. |
| `--bs-level-select-border-color` | `var(--tc-border)` | 1px hairline border around the canvas. |
| `--bs-level-select-edge-color` | `var(--tc-border-strong)` | Default SVG edge stroke color. |
| `--bs-level-select-edge-completed-color` | `var(--tc-app-accent)` | Edge stroke color when both nodes are completed. |
| `--bs-level-select-edge-width` | `1.5` | SVG stroke-width (unitless). |
| `--bs-level-select-node-size` | `4rem` | Node square dimension. |
| `--bs-level-select-node-bg` | `var(--tc-surface)` | Node background (default state). |
| `--bs-level-select-node-border-color` | `var(--tc-border-strong)` | Node border color (default state). |
| `--bs-level-select-node-color` | `var(--tc-text)` | Node text/icon color (default state). |
| `--bs-level-select-node-hover-bg` | `var(--tc-surface-muted)` | Node background on hover. |
| `--bs-level-select-node-hover-border` | `var(--tc-app-accent)` | Node border on hover. |
| `--bs-level-select-node-selected-bg` | `var(--tc-app-accent)` | Node background when selected. |
| `--bs-level-select-node-selected-color` | `#fff` | Node text/icon color when selected. |
| `--bs-level-select-node-selected-border` | `var(--tc-app-accent)` | Node border when selected. |
| `--bs-level-select-node-completed-bg` | `var(--tc-surface)` | Completed node background (not selected). |
| `--bs-level-select-node-completed-color` | `var(--tc-success)` | Completed node icon/text color. |
| `--bs-level-select-node-completed-border` | `var(--tc-success)` | Completed node border color. |
| `--bs-level-select-node-locked-bg` | `var(--tc-surface)` | Locked node background. |
| `--bs-level-select-node-locked-color` | `var(--tc-text-faint)` | Locked node icon/text color. |
| `--bs-level-select-node-locked-border` | `var(--tc-border)` | Locked node border color. |
| `--bs-level-select-node-locked-opacity` | `0.55` | Opacity applied to locked nodes. |
| `--bs-level-select-glyph-size` | `1.125rem` | Icon/glyph size inside the node. |
| `--bs-level-select-label-font-size` | `0.6875rem` | Node label font size. |
| `--bs-level-select-label-color` | `var(--tc-text-muted)` | Node label color. |
| `--bs-level-select-star-size` | `0.625rem` | Star character font size. |
| `--bs-level-select-star-color` | `var(--tc-border-strong)` | Empty star color. |
| `--bs-level-select-star-filled-color` | `var(--tc-app-accent)` | Filled star color. |

**Example**

```html
<tc-level-select id="map" width="600" height="360"></tc-level-select>

<script>
    const map = document.getElementById('map')

    map.nodes = [
        { id: '1', x: 100, y: 180, label: 'Intro',   completed: true, bestStars: 3, stars: 3 },
        { id: '2', x: 260, y: 100, label: 'Forest',  completed: true, bestStars: 2, stars: 3 },
        { id: '3', x: 260, y: 260, label: 'Cave',    completed: false },
        { id: '4', x: 420, y: 180, label: 'Castle',  locked: true, icon: 'castle' },
    ]

    map.edges = [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '3', to: '4' },
    ]

    map.selectedId = '3'

    map.addEventListener('tc-select',  e => console.log('selected',  e.detail.id))
    map.addEventListener('tc-confirm', e => console.log('confirmed', e.detail.id))
</script>
```