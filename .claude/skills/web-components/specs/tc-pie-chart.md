---
component: tc-pie-chart
---

### tc-pie-chart

Inline-SVG pie or donut chart showing a percentage distribution with an interactive (hoverable + toggleable) legend and an optional donut centre label. Sharp square corners on the frame, legend rows and swatches; the pie/donut disc is the one sanctioned circular shape. Slice fills default to a small slate-leaning ramp (neutrals first, exposed as `--bs-pie-chart-slice-N`) unless a slice supplies its own `color` — the one sanctioned data-encoding override. Slices are drawn from accumulated angles; the visible total (toggled-off slices excluded) drives the geometry and the visible slices' percentages. Hovering a slice — or its legend row — recedes the other slices (highlight via opacity, not a new hue), pulls the active slice out slightly (frozen under `prefers-reduced-motion`), and shows an overlay-tier tooltip (ink surface, white text, `--tc-shadow-md`, 3px coloured left stripe) with the label, value and percentage; for a donut the centre label swaps to the active slice's label + percentage. The legend renders every slice as a real focusable `<button>` with `aria-pressed`; clicking one toggles that slice's visibility (the last visible slice cannot be hidden) and fires `tc-slice-select`. Slices are set via the `data` JS property. The SVG carries `role="img"` with a summary `aria-label`; loading sets `aria-busy="true"`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart |
| `subtitle` | `string` | — | Secondary header line below the title |
| `donut` | boolean | `false` | Cut out the centre to form a donut (enables the centre label) |
| `center-label` | `string` | — | Text shown in the donut hole (only meaningful with `donut`) |
| `show-legend` | boolean | `true` | Render the toggle legend; set `show-legend="false"` to hide |
| `height` | `number` | `320` | Chart size in px (the SVG is a square of this size) |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `PieChartSlice[]` | `[]` | Array of slice descriptors (see below); setting it resets toggles and re-renders |

**PieChartSlice shape**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Slice label shown in the legend, tooltip and centre label |
| `value` | `number` | Slice magnitude; percentages are `value / total * 100` |
| `color` | `string` | Optional explicit fill colour (any CSS color); otherwise the slate ramp is used |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-slice-select` | `{ slice: PieChartSlice, index: number }` | Fired when a legend entry (or slice) is clicked |

**Slots**

_None._ The component owns its `<svg>`; arbitrary slotted children are not preserved.

```html
<tc-pie-chart title="Traffic sources" subtitle="Last 30 days" height="280"></tc-pie-chart>

<script>
const pie = document.querySelector('tc-pie-chart')
pie.data = [
    { label: 'Direct', value: 4200 },
    { label: 'Organic search', value: 3100 },
    { label: 'Referral', value: 1800 },
    { label: 'Social', value: 1200, color: 'var(--tc-warning)' },
]
pie.addEventListener('tc-slice-select', (e) => console.log(e.detail.slice.label, e.detail.index))
</script>

<!-- donut with a centre label -->
<tc-pie-chart donut center-label="Used" title="Storage usage" height="280"></tc-pie-chart>

<!-- legend hidden -->
<tc-pie-chart show-legend="false" title="Chart only"></tc-pie-chart>

<!-- loading skeleton -->
<tc-pie-chart loading title="Loading…"></tc-pie-chart>
```

---