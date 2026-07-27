---
component: tc-funnel-chart
---

### tc-funnel-chart

SVG funnel chart visualising a conversion flow as a vertical stack of tapering trapezoids: each step's top width is proportional to its value and its bottom width matches the next step's value, producing the funnel taper. Each segment is labelled with its stage name (Inter) and its percentage of the first step (JetBrains Mono). Sharp square corners; the chart frame sits on `--tc-surface` behind a 1px hairline. Segment fills default to a graduated slate ramp (kept dark enough for the white in-segment labels) unless a step supplies its own `color` — the one sanctioned data-encoding override. Hover is a subtle highlight (opacity + a hairline outline), focus is a visible 2px accent outline. The tooltip is overlay tier — ink surface, white text, elevation shadow, a 3px colored left stripe. Every segment is keyboard-reachable (`role="button"`, `tabindex="0"`) and clicking/activating one fires `tc-select` and calls the optional `onSelect` callback. Data is set via the `data` JS property.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart |
| `subtitle` | `string` | — | Secondary header line below the title |
| `height` | `number` | `320` | Chart height in px (drives the SVG viewBox) |
| `show-labels` | boolean | `true` | Render the per-step label + percentage text; set `show-labels="false"` to hide |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `FunnelStep[]` | `[]` | Array of funnel step descriptors (see below) |
| `onSelect` | `(step, index) => void \| null` | `null` | Optional callback fired (alongside `tc-select`) when a segment is clicked/activated |

**FunnelStep shape**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Stage label shown in the segment and the tooltip |
| `value` | `number` | Numeric value driving the segment width; percentage is `value / data[0].value * 100` |
| `color` | `string` | Optional explicit segment color (any CSS color); otherwise the slate ramp is used |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ step: FunnelStep, index: number }` | Fired when a segment is clicked or activated with Enter/Space |

**Slots**

_None._ The component owns its `<svg>`; arbitrary slotted children are not preserved.

```html
<tc-funnel-chart title="Activation funnel" subtitle="Last 30 days" height="320"></tc-funnel-chart>

<script>
const funnel = document.querySelector('tc-funnel-chart')
funnel.data = [
    { label: 'Visitors', value: 12400 },
    { label: 'Signups', value: 5600 },
    { label: 'Activated', value: 3100 },
    { label: 'Paying', value: 1450 },
]
funnel.addEventListener('tc-select', (e) => console.log(e.detail.step, e.detail.index))
funnel.onSelect = (step, index) => console.log('callback', step.label, index)
</script>

<!-- labels hidden -->
<tc-funnel-chart show-labels="false" title="Geometry only"></tc-funnel-chart>

<!-- per-step colors -->
<script>
document.querySelector('tc-funnel-chart').data = [
    { label: 'Cart', value: 4800, color: 'var(--tc-app-accent)' },
    { label: 'Payment', value: 2400, color: 'var(--tc-warning)' },
    { label: 'Confirmed', value: 1900, color: 'var(--tc-success)' },
]
</script>

<!-- loading skeleton -->
<tc-funnel-chart loading title="Loading…"></tc-funnel-chart>
```

---