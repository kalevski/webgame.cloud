---
component: tc-benchmark-chart
---

### tc-benchmark-chart

Horizontal SVG bar chart comparing benchmark values, with leader highlighting and a linear or log scale. Sharp square corners, slate-neutral track, slate-ink bar fill, JetBrains Mono value numbers; the leader bar gets the one sanctioned emphasis (a 135° slate-ink gradient). Set bars exclusively via the `bars` JS property.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart (or use the `title` slot for rich content) |
| `scale` | `linear\|log` | `linear` | Bar widths are linear, or log-scaled when values span orders of magnitude |
| `lower-is-better` | boolean | `false` | Flips which bar is the leader — lowest value when present, highest when absent |
| `interactive` | boolean | `false` | Makes each bar row a focusable `role="button"` with keyboard activation; also implied when `onBarClick` is set |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bars` | `BenchmarkBar[]` | `[]` | Array of bar descriptors (see below) |
| `onBarClick` | `(bar, index) => void \| null` | `null` | Optional callback fired (alongside the `tc-bar-click` event) when a row is clicked |

**BenchmarkBar shape**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Row label (left column) |
| `value` | `number` | Numeric value driving the bar width and the formatted value label |
| `unit` | `string` | Optional unit suffix shown after the value (e.g. `req/s`, `ms`) |
| `color` | `string` | Optional per-bar fill color (any CSS color); overrides the slate-ink default |
| `hint` | `string` | Optional tooltip text (SVG `<title>`) for the row |
| `baseline` | `boolean` | Optional marker for the reference/baseline row |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-bar-click` | `{ bar: BenchmarkBar, index: number }` | Fired when a bar row is clicked or activated (only when interactive) |

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich header content; used when the `title` attribute is absent |

```html
<tc-benchmark-chart title="Requests per second"></tc-benchmark-chart>

<script>
const chart = document.querySelector('tc-benchmark-chart')
chart.bars = [
    { label: '@your/server', value: 124000, unit: 'req/s' },
    { label: 'fastify', value: 102000, unit: 'req/s' },
    { label: 'express', value: 41000, unit: 'req/s', baseline: true },
]
</script>

<!-- lower-is-better + log scale -->
<tc-benchmark-chart lower-is-better scale="log" title="Read latency (log)"></tc-benchmark-chart>

<!-- interactive rows -->
<tc-benchmark-chart interactive title="Lines of code"></tc-benchmark-chart>
<script>
  document.querySelector('tc-benchmark-chart[interactive]')
      .addEventListener('tc-bar-click', (e) => console.log(e.detail.bar, e.detail.index))
</script>

<!-- rich title via slot -->
<tc-benchmark-chart>
    <span slot="title">Requests per second <code>v2.4</code></span>
</tc-benchmark-chart>
```

---