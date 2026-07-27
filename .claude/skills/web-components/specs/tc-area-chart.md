---
component: tc-area-chart
---

### tc-area-chart

SVG area chart with filled regions, gridlines, an interactive tooltip, and an optional legend. Sharp square corners, slate-neutral chart frame on `--tc-surface` behind a 1px hairline; faint slate gridlines; mono micro axis labels. The primary series rides the slate ink ramp, the cyan accent is spent on at most one emphasized series, and additional series step down the slate ramp; area fills are low-opacity tints of the series stroke color. The tooltip is overlay tier — ink surface, white text, elevation shadow, a 3px colored left stripe. Series are set via the `series` JS property; `xFormatter`/`yFormatter` are JS function properties.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart |
| `subtitle` | `string` | — | Secondary header line below the title |
| `height` | `number` | `260` | Chart height in px (drives the SVG viewBox) |
| `stacked` | boolean | `false` | Stack series areas cumulatively instead of overlaying them |
| `show-grid` | boolean (default true) | `true` | Render horizontal gridlines + Y-axis labels; set `show-grid="false"` to hide |
| `show-legend` | boolean (default true) | `true` | Render the series legend; set `show-legend="false"` to hide |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `series` | `AreaChartSeries[]` | `[]` | Array of series descriptors (see below) |
| `xFormatter` | `(v: string \| number) => string` | `String` | Formats x-axis tick + tooltip x labels |
| `yFormatter` | `(v: number) => string` | `String` | Formats y-axis tick + tooltip y labels |
| `onPointHover` | `(detail) => void \| null` | `null` | Optional callback fired (alongside `tc-point-hover`) as the pointer moves over the chart |

**AreaChartSeries shape**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Series name (legend + tooltip) |
| `points` | `{ x: string \| number, y: number }[]` | The data points |
| `color` | `string` | Optional explicit series color (any CSS color); otherwise the slate/accent ramp is used |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-point-hover` | `{ series: AreaChartSeries, point: { x, y }, index: number }` | Fired as the pointer moves near a data point (`index` is the point index within its series) |

**Slots**

_None._ The component owns its `<svg>`; arbitrary slotted children are not preserved.

```html
<tc-area-chart title="Site traffic" subtitle="Last 8 months" height="280"></tc-area-chart>

<script>
const chart = document.querySelector('tc-area-chart')
chart.series = [
    { name: 'Visitors', points: [{ x: 'Jan', y: 1200 }, { x: 'Feb', y: 1900 }, { x: 'Mar', y: 1700 }] },
    { name: 'Signups',  points: [{ x: 'Jan', y: 180 },  { x: 'Feb', y: 240 },  { x: 'Mar', y: 210 }] },
]
chart.yFormatter = (v) => `${(v / 1000).toFixed(1)}k`
chart.addEventListener('tc-point-hover', (e) => console.log(e.detail.series.name, e.detail.point))
</script>

<!-- stacked, no gridlines -->
<tc-area-chart stacked show-grid="false" title="Revenue by plan"></tc-area-chart>

<!-- loading skeleton -->
<tc-area-chart loading title="Loading…"></tc-area-chart>
```

---