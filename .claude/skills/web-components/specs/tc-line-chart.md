---
component: tc-line-chart
---

### tc-line-chart

Inline-SVG line chart plotting multiple series on shared axes, with grid hairlines, axis tick labels, point markers, hover tooltips, and an optional toggle legend. Sharp square corners; the chart frame sits on `--tc-surface` behind a 1px hairline. Grid lines and axes are slate-100/`--tc-border` hairlines; axis tick labels are JetBrains Mono micro text. Series strokes default to a small slate-leaning ramp (neutrals first, exposed as `--bs-line-chart-series-N`) unless a series supplies its own `color` — the one sanctioned data-encoding override. The x domain is the union of every series' x values; the y domain is computed across the currently-visible series and rounded up to a clean max. Moving the pointer near a point enlarges its marker and shows an overlay-tier tooltip (ink surface, white text, `--tc-shadow-md`, 3px colored left stripe) with the x label and that series' formatted y value, and fires `tc-point-hover`. The legend (shown for 2+ series) renders each series name with a square colour swatch as a real focusable `<button>` with `aria-pressed`; clicking one toggles that series' visibility (the last visible series cannot be hidden). Series are set via the `series` JS property; `xFormatter`/`yFormatter` are function properties.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart |
| `subtitle` | `string` | — | Secondary header line below the title |
| `height` | `number` | `320` | Chart height in px (drives the SVG viewBox) |
| `show-grid` | boolean | `true` | Render grid hairlines; set `show-grid="false"` to hide |
| `show-legend` | boolean | `true` | Render the toggle legend (only when 2+ series); set `show-legend="false"` to hide |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `series` | `LineChartSeries[]` | `[]` | Array of series descriptors (see below) |
| `xFormatter` | `(v) => string \| null` | `null` | Formats x-axis tick labels and the tooltip x line |
| `yFormatter` | `(v) => string \| null` | `null` | Formats y-axis tick labels and tooltip values (defaults to a k/M abbreviator) |

**LineChartSeries shape**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Series name shown in the legend and tooltip (`label` is also accepted) |
| `data` | `{ x: number\|string, y: number }[]` | The ordered points to plot (`points` is also accepted) |
| `color` | `string` | Optional explicit stroke color (any CSS color); otherwise the slate ramp is used |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-point-hover` | `{ series: LineChartSeries, point: LineChartPoint }` | Fired when the pointer hovers near a data point |

**Slots**

_None._ The component owns its `<svg>`; arbitrary slotted children are not preserved.

```html
<tc-line-chart title="Quarterly performance" subtitle="By month" height="320"></tc-line-chart>

<script>
const chart = document.querySelector('tc-line-chart')
chart.series = [
    { name: 'Revenue', data: [{ x: 'Jan', y: 4200 }, { x: 'Feb', y: 5600 }, { x: 'Mar', y: 7100 }] },
    { name: 'Costs', data: [{ x: 'Jan', y: 2800 }, { x: 'Feb', y: 3200 }, { x: 'Mar', y: 3900 }] },
    { name: 'Profit', data: [{ x: 'Jan', y: 1400 }, { x: 'Feb', y: 2400 }, { x: 'Mar', y: 3200 }], color: 'var(--tc-success)' },
]
chart.yFormatter = (v) => `$${(v / 1000).toFixed(1)}k`
chart.xFormatter = (v) => `${v} '24`
chart.addEventListener('tc-point-hover', (e) => console.log(e.detail.series.name, e.detail.point))
</script>

<!-- grid + legend hidden -->
<tc-line-chart show-grid="false" show-legend="false" title="Minimal"></tc-line-chart>

<!-- loading skeleton -->
<tc-line-chart loading title="Loading…"></tc-line-chart>
```

---