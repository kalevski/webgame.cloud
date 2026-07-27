---
component: tc-skill-tree
---

### tc-skill-tree

Node-graph skill tree with prerequisite edges, locked/unlocked/selected states, rank counters, and an optional remaining-points readout. Styled to the toolcase design system: flat slate surfaces, sharp corners, 1px hairline borders, ink accent for selected/unlocked states, JetBrains Mono for labels and rank counters.

**Tag:** `tc-skill-tree`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | `""` | ID of the currently selected node. Setting re-renders with the new selection. Cleared with an empty string or `removeAttribute`. |
| `points` | number | `null` | Available skill points shown in the points strip above the canvas. Omit to hide the strip. |
| `width` | number | `600` | Canvas width in pixels. |
| `height` | number | `400` | Canvas height in pixels. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `selectedId` | `string` | Reflects the `selected-id` attribute. |
| `points` | `number \| null` | Reflects the `points` attribute. |
| `width` | `number` | Reflects the `width` attribute. |
| `height` | `number` | Reflects the `height` attribute. |
| `nodes` | `SkillNode[]` | Array of skill nodes. Setting re-renders. |
| `edges` | `SkillTreeEdge[]` | Array of prerequisite edges. Setting re-renders. |
| `onSelect` | `((detail: { id: string }) => void) \| null` | Optional callback, fires alongside `tc-select`. |
| `onUnlock` | `((detail: { id: string }) => void) \| null` | Optional callback, fires alongside `tc-unlock`. |

**`SkillNode` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique identifier for this node. |
| `x` | `number` | yes | X coordinate of the node center (pixels, relative to the canvas). |
| `y` | `number` | yes | Y coordinate of the node center (pixels, relative to the canvas). |
| `label` | `string` | no | Short label rendered below the glyph in JetBrains Mono. |
| `icon` | `string` | no | Lucide icon name (kebab-case, e.g. `"sword"`, `"shield"`). Resolved at render time. |
| `locked` | `boolean` | no | Node is prerequisite-locked — rendered at reduced opacity, not interactive. |
| `unlocked` | `boolean` | no | Node has been unlocked — accent border + check glyph when no icon is set. |
| `rank` | `number` | no | Current rank of this skill. Shown alongside `maxRank` as `rank/maxRank`. |
| `maxRank` | `number` | no | Maximum rank. Rank counter is hidden unless both `rank` and `maxRank` are numbers. |
| `description` | `string` | no | Tooltip text shown via the native `title` attribute on hover. |

**`SkillTreeEdge` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `string` | yes | ID of the source node. |
| `to` | `string` | yes | ID of the target node. Edge renders with the `--unlocked` accent color only when both nodes have `unlocked: true`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string }` | Fired when an unlocked node is clicked or activated by keyboard (Enter / Space). Bubbles and is composed. |
| `tc-unlock` | `{ id: string }` | Fired when an unlocked node is double-clicked. Bubbles and is composed. |

**Slots**

None. `tc-skill-tree` is entirely data-driven via JS properties and attributes.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-skill-tree-bg` | `var(--tc-surface)` | Canvas background color. |
| `--bs-skill-tree-border-color` | `var(--tc-border)` | Canvas 1px hairline border color. |
| `--bs-skill-tree-edge-color` | `var(--tc-border-strong)` | Default SVG edge stroke color. |
| `--bs-skill-tree-edge-unlocked-color` | `var(--tc-app-accent)` | Edge stroke color when both nodes are unlocked. |
| `--bs-skill-tree-edge-width` | `1.5` | SVG `stroke-width` (unitless). |
| `--bs-skill-tree-node-size` | `4rem` | Node square dimension. |
| `--bs-skill-tree-node-bg` | `var(--tc-surface)` | Node background (default / available state). |
| `--bs-skill-tree-node-border-color` | `var(--tc-border-strong)` | Node border (default / available state). |
| `--bs-skill-tree-node-color` | `var(--tc-text)` | Node text/icon color (default / available state). |
| `--bs-skill-tree-node-hover-bg` | `var(--tc-surface-muted)` | Node background on hover. |
| `--bs-skill-tree-node-hover-border` | `var(--tc-app-accent)` | Node border on hover. |
| `--bs-skill-tree-node-selected-bg` | `var(--tc-app-accent)` | Node background when selected. |
| `--bs-skill-tree-node-selected-color` | `#fff` | Node text/icon color when selected. |
| `--bs-skill-tree-node-selected-border` | `var(--tc-app-accent)` | Node border when selected. |
| `--bs-skill-tree-node-unlocked-bg` | `var(--tc-surface)` | Unlocked node background (not selected). |
| `--bs-skill-tree-node-unlocked-color` | `var(--tc-success)` | Unlocked node icon/text color. |
| `--bs-skill-tree-node-unlocked-border` | `var(--tc-success)` | Unlocked node border color. |
| `--bs-skill-tree-node-locked-bg` | `var(--tc-surface)` | Locked node background. |
| `--bs-skill-tree-node-locked-color` | `var(--tc-text-faint)` | Locked node icon/text color. |
| `--bs-skill-tree-node-locked-border` | `var(--tc-border)` | Locked node border color. |
| `--bs-skill-tree-node-locked-opacity` | `0.5` | Opacity applied to locked nodes. |
| `--bs-skill-tree-glyph-size` | `1.125rem` | Icon/glyph size inside each node. |
| `--bs-skill-tree-label-font-size` | `0.6875rem` | Node label font size. |
| `--bs-skill-tree-label-color` | `var(--tc-text-muted)` | Node label color. |
| `--bs-skill-tree-rank-font-size` | `0.625rem` | Rank counter font size. |
| `--bs-skill-tree-rank-color` | `var(--tc-text-faint)` | Rank counter color. |
| `--bs-skill-tree-points-bg` | `var(--tc-surface-muted)` | Points strip background. |
| `--bs-skill-tree-points-border-color` | `var(--tc-border)` | Points strip border color. |
| `--bs-skill-tree-points-label-color` | `var(--tc-text-muted)` | Points strip label color. |
| `--bs-skill-tree-points-value-color` | `var(--tc-app-accent)` | Points strip value color. |

**Example**

```html
<tc-skill-tree id="tree" selected-id="s4" points="3" width="660" height="380"></tc-skill-tree>

<script>
  const tree = document.getElementById('tree')

  tree.nodes = [
    { id: 's1', x: 100, y: 200, label: 'Strike',  icon: 'sword',       unlocked: true, rank: 3, maxRank: 3 },
    { id: 's2', x: 260, y: 110, label: 'Parry',   icon: 'shield',      unlocked: true, rank: 1, maxRank: 3 },
    { id: 's3', x: 260, y: 290, label: 'Stance',  icon: 'footprints',  unlocked: true, rank: 2, maxRank: 3 },
    { id: 's4', x: 420, y: 110, label: 'Riposte', icon: 'zap',                         rank: 0, maxRank: 3 },
    { id: 's5', x: 420, y: 290, label: 'Endure',  icon: 'heart-pulse',                 rank: 0, maxRank: 3 },
    { id: 's6', x: 560, y: 200, label: 'Mastery', icon: 'star',        locked: true,   rank: 0, maxRank: 1 },
  ]

  tree.edges = [
    { from: 's1', to: 's2' },
    { from: 's1', to: 's3' },
    { from: 's2', to: 's4' },
    { from: 's3', to: 's5' },
    { from: 's4', to: 's6' },
    { from: 's5', to: 's6' },
  ]

  tree.addEventListener('tc-select', e => console.log('Selected:', e.detail.id))
  tree.addEventListener('tc-unlock', e => console.log('Unlocked:', e.detail.id))
</script>
```

---