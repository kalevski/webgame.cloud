---
component: tc-metric-grid
---

### tc-metric-grid

CSS-grid container for metric tiles with configurable column count (2, 3, or 4). Tiles can be supplied as a JS `items` array or as light-DOM children (`tc-metric-tile` elements or equivalent markup). No interactive targets — purely presentational.

**Tag:** `tc-metric-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `2 \| 3 \| 4` | `3` | Number of grid columns. Clamped to `2`, `3`, or `4`; invalid values fall back to `3`. Collapses to fewer columns on narrow viewports. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `MetricGridColumns` | Reflects the `columns` attribute as a number. |
| `items` | `MetricGridItem[]` | Array of tile data objects. Setting re-renders the generated tiles while preserving any slotted light-DOM children. Default `[]`. |

**`MetricGridItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Tile caption — rendered as an uppercase mono micro-label. |
| `value` | `string` | yes | Metric value rendered as the large display figure. |
| `unit` | `string` | no | Optional unit suffix (e.g. `"ms"`, `"%"`). |
| `icon` | `string` | no | Optional PascalCase lucide icon name (e.g. `"Activity"`, `"DollarSign"`). Decorative — `aria-hidden`. |
| `hint` | `string` | no | Optional faint sub-text line beneath the value. |
| `key` | `string` | no | Optional React-compatible key hint (not rendered). |

**Events**

None. `tc-metric-grid` is a purely presentational container.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Light-DOM tile children (e.g. `<tc-metric-tile>` elements). Rendered alongside — and after — tiles generated from the `items` property. Preserved across re-renders. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-metric-grid-border-color` | `var(--tc-border)` | Hairline gap color (shown as the 1px grid background). |
| `--bs-metric-grid-bg` | `var(--tc-surface)` | Tile surface background within the grid. |
| `--bs-metric-grid-outer-border` | `1px solid var(--bs-metric-grid-border-color)` | Outer border wrapping the entire grid. |

```html
<!-- items property (set via JS) -->
<tc-metric-grid id="metrics" columns="3"></tc-metric-grid>
<script>
  document.getElementById('metrics').items = [
    { label: 'Total Users', value: '12,480', icon: 'Users' },
    { label: 'Revenue', value: '$24,500', unit: 'USD', icon: 'DollarSign' },
    { label: 'Avg Response', value: '142', unit: 'ms', icon: 'Zap', hint: 'P50 over 24 h' },
  ]
</script>

<!-- Slotted tc-metric-tile children -->
<tc-metric-grid columns="3">
  <tc-metric-tile label="Build Status" value="Passing" icon="CheckCircle"></tc-metric-tile>
  <tc-metric-tile label="Coverage" value="94.2" unit="%" icon="Shield"></tc-metric-tile>
  <tc-metric-tile label="Open PRs" value="7" hint="2 awaiting review"></tc-metric-tile>
</tc-metric-grid>

<!-- 4-column grid -->
<tc-metric-grid columns="4"></tc-metric-grid>

<!-- 2-column grid -->
<tc-metric-grid columns="2"></tc-metric-grid>
```

---