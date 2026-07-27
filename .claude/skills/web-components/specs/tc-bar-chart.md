---
component: tc-bar-chart
---

### tc-bar-chart

SVG bar chart in vertical (columns) or horizontal (rows) orientation, with category/value axis labels, an interactive tooltip, and optional per-bar value labels. Sharp square corners, slate-neutral chart frame on `--tc-surface` behind a 1px hairline; faint slate baseline/axis hairlines; mono micro category + value labels. Bar fills default to the slate ink ramp (`--tc-app-accent`) unless an item supplies its own `color`; the cyan accent is the one rare emphasis slot. The tooltip is overlay tier — ink surface, white text, elevation shadow, a 3px colored left stripe. Every bar is keyboard-reachable (`role="button"`) and clicking/activating a bar fires `tc-bar-click`. Data is set via the `data` JS property; `yFormatter` is a JS function property.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart |
| `subtitle` | `string` | — | Secondary header line below the title |
| `orientation` | `vertical\|horizontal` | `vertical` | Lay bars out as columns (vertical) or rows (horizontal) |
| `height` | `number` | `260` | Chart height in px (drives the SVG viewBox) |
| `show-values` | boolean | `false` | Render the formatted value at each bar's end |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `BarChartDataItem[]` | `[]` | Array of bar descriptors (see below) |
| `yFormatter` | `(v: number) => string` | `String` | Formats axis ticks, value labels, and the tooltip value |
| `onClick` | `(item, index) => void \| null` | `null` | Optional callback fired (alongside `tc-bar-click`) when a bar is clicked |

**BarChartDataItem shape**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Category label shown on the axis (and in the tooltip) |
| `value` | `number` | Numeric value driving the bar size and the formatted value label |
| `color` | `string` | Optional explicit bar color (any CSS color); otherwise the slate/accent ramp is used |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-bar-click` | `{ item: BarChartDataItem, index: number }` | Fired when a bar is clicked or activated with Enter/Space |

**Slots**

_None._ The component owns its `<svg>`; arbitrary slotted children are not preserved.

```html
<tc-bar-chart title="Site traffic" subtitle="Last 8 months" height="280" show-values></tc-bar-chart>

<script>
const chart = document.querySelector('tc-bar-chart')
chart.data = [
    { label: 'Jan', value: 1200 },
    { label: 'Feb', value: 1900 },
    { label: 'Mar', value: 1700 },
]
chart.yFormatter = (v) => `${(v / 1000).toFixed(1)}k`
chart.addEventListener('tc-bar-click', (e) => console.log(e.detail.item, e.detail.index))
</script>

<!-- horizontal rows -->
<tc-bar-chart orientation="horizontal" title="Lines of code" height="240"></tc-bar-chart>

<!-- per-item colors -->
<script>
document.querySelector('tc-bar-chart[orientation="horizontal"]').data = [
    { label: 'Passing', value: 142, color: 'var(--tc-success)' },
    { label: 'Failing', value: 6, color: 'var(--tc-danger)' },
]
</script>

<!-- loading skeleton -->
<tc-bar-chart loading title="Loading…"></tc-bar-chart>
```

---