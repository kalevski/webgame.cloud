---
component: tc-heatmap
---

### tc-heatmap

Heatmap grid with colour-interpolated cells and hover tooltips. Computes the value domain (min→max) across `data` and interpolates each cell's fill along `colorScale`; cells with no matching datum render muted. Includes axis micro-labels, an optional min→max legend bar, and a tooltip on hover. The grid is a 1px-gap hairline grid with sharp-cornered cells; the default scale is slate→ink neutrals so the chart carries on the slate ramp by default.

**Tag:** `tc-heatmap`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Title rendered above the grid (weight 600) and used as the grid's `aria-label` |
| `subtitle` | string | — | Muted sub-label beneath the title |
| `cell-size` | number | `32` | Pixel size of each square grid cell (min `12`) |
| `loading` | boolean | `false` | When present, renders a shimmering skeleton grid and sets `aria-busy="true"` |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `data` | `HeatmapCell[]` | The cell data — set via JS property; setting it re-renders |
| `rows` | `(string \| number)[]` | Y-axis categories, top→bottom |
| `cols` | `(string \| number)[]` | X-axis categories, left→right |
| `colorScale` | `string[]` | Array of hex stops to interpolate across; when omitted, a slate→ink neutral scale is used |
| `cellSize` | number | Reflects the `cell-size` attribute |

`HeatmapCell`:

| Field | Type | Description |
|-------|------|-------------|
| `row` | `string \| number` | Row (y-axis) category this cell belongs to |
| `col` | `string \| number` | Column (x-axis) category this cell belongs to |
| `value` | number | Numeric value mapped to a colour across the data's min→max |
| `label` | string? | Optional extra label shown in the tooltip and accessible name |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-cell-hover` | `{ cell: HeatmapCell, row, col, value }` | Fired when a data cell is hovered (bubbles, composed) |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-heatmap-cell-size` | `32px` | Cell size (also set inline from the `cell-size` attribute) |
| `--bs-heatmap-frame-border` | `1px solid var(--tc-border)` | Outer grid frame |
| `--bs-heatmap-gap-color` | `var(--tc-slate-100)` | Hairline grid-gap colour |
| `--bs-heatmap-empty-bg` | `var(--tc-surface-muted)` | Fill for cells with no datum |
| `--bs-heatmap-hover-outline` | `var(--tc-app-accent)` | Hover hairline outline colour |
| `--bs-heatmap-title-color` | `var(--tc-text)` | Title colour |
| `--bs-heatmap-label-color` | `var(--tc-text-muted)` | Axis label colour |
| `--bs-heatmap-tooltip-bg` | `var(--tc-ink)` | Tooltip surface |
| `--bs-heatmap-tooltip-color` | `#fff` | Tooltip text colour |
| `--bs-heatmap-legend-bar-width` | `7rem` | Legend gradient bar width |
| `--bs-heatmap-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton base fill |

```html
<!-- Default neutral scale -->
<tc-heatmap id="hm" title="Weekly activity" subtitle="Events by day and hour"></tc-heatmap>
<script>
  const el = document.getElementById('hm')
  el.rows = ['Mon', 'Tue', 'Wed']
  el.cols = ['00', '08', '16']
  el.data = [
    { row: 'Mon', col: '00', value: 4 },
    { row: 'Mon', col: '08', value: 22, label: '22 events' },
    { row: 'Tue', col: '16', value: 51 },
    { row: 'Wed', col: '08', value: 33 },
  ]
  el.addEventListener('tc-cell-hover', e => console.log(e.detail))
</script>

<!-- Explicit colour scale + larger cells -->
<tc-heatmap id="hm2" cell-size="44" title="Traffic"></tc-heatmap>
<script>
  const el2 = document.getElementById('hm2')
  el2.colorScale = ['#f1f5f9', '#fb923c', '#991b1b']
  el2.rows = ['A', 'B']
  el2.cols = ['x', 'y']
  el2.data = [
    { row: 'A', col: 'x', value: 1 },
    { row: 'B', col: 'y', value: 9 },
  ]
</script>
```