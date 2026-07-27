---
component: tc-slices-card
---

### tc-slices-card

Dashboard card with a donut/pie chart and a labeled legend. Driven by a JS property array of slices. Purely presentational — no events.

**Tag:** `tc-slices-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string \| null` | `null` | Optional card heading displayed in the card header. |
| `size` | `number` | `160` | Donut SVG diameter in pixels. |
| `stroke-width` | `number` | `24` | Donut ring thickness in pixels. |
| `loading` | boolean | `false` | When set, replaces card content with an animated skeleton placeholder. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string \| null` | Reflected from the `title` attribute (native `HTMLElement.title`). |
| `slices` | `SliceItem[]` | Array of slice data objects. Setting re-computes and re-renders the donut and legend. |
| `size` | `number` | Reflected from the `size` attribute. |
| `strokeWidth` | `number` | Reflected from the `stroke-width` attribute. |
| `loading` | `boolean` | Reflected from the `loading` boolean attribute. |

**SliceItem interface**

```ts
interface SliceItem {
  label: string    // Legend label text
  value: number   // Numeric value — used to compute arc length and percentage
  color?: string  // Optional CSS color. Defaults to a quiet slate ramp when omitted.
}
```

**Events**

None. `tc-slices-card` is purely presentational.

**Slots**

None. Driven entirely by attributes and the `slices` JS property.

**Accessibility**

- The donut SVG carries `aria-hidden="true"`; data is conveyed by the legend list.
- The legend is a `<ul role="list">` with text labels, numeric values, and percentage — not color-only.
- During loading, the host receives `role="status"` and `aria-busy="true"`; a visually-hidden `Loading…` span is present for screen readers.
- `prefers-reduced-motion` freezes the skeleton shimmer to a static fill.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-slices-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-slices-card-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-slices-card-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-slices-card-padding-y` | `1rem` | Vertical inner padding. |
| `--bs-slices-card-padding-x` | `1.25rem` | Horizontal inner padding. |
| `--bs-slices-card-title-color` | `var(--tc-text-muted)` | Card header title colour. |
| `--bs-slices-card-title-font-size` | `0.6875rem` | Card header title font size. |
| `--bs-slices-card-total-color` | `var(--tc-text)` | Center total figure colour. |
| `--bs-slices-card-total-font-size` | `1rem` | Center total figure font size. |
| `--bs-slices-card-total-font-weight` | `600` | Center total figure font weight. |
| `--bs-slices-card-swatch-size` | `0.625rem` | Legend color swatch width/height. |
| `--bs-slices-card-legend-label-color` | `var(--tc-text)` | Legend label colour. |
| `--bs-slices-card-legend-label-font-size` | `0.8125rem` | Legend label font size. |
| `--bs-slices-card-legend-value-color` | `var(--tc-text-muted)` | Legend value colour. |
| `--bs-slices-card-legend-percent-color` | `var(--tc-text-muted)` | Legend percent colour. |
| `--bs-slices-card-empty-ring-color` | `var(--tc-border)` | Stroke colour when no slices are provided. |

```html
<!-- Colored slices -->
<tc-slices-card id="sc1" title="Downloads by Language"></tc-slices-card>
<script>
  document.getElementById('sc1').slices = [
    { label: 'JavaScript', value: 4820, color: '#f59e0b' },
    { label: 'TypeScript', value: 3140, color: '#6366f1' },
    { label: 'Python',     value: 2200, color: '#22c55e' },
  ]
</script>

<!-- Uncolored — quiet slate ramp applied automatically -->
<tc-slices-card id="sc2" title="Issues by Status"></tc-slices-card>
<script>
  document.getElementById('sc2').slices = [
    { label: 'Open',        value: 142 },
    { label: 'In Progress', value: 87  },
    { label: 'Closed',      value: 218 },
  ]
</script>

<!-- Custom size -->
<tc-slices-card id="sc3" title="Large donut" size="200" stroke-width="32"></tc-slices-card>
<script>
  document.getElementById('sc3').slices = [
    { label: 'A', value: 60, color: '#6366f1' },
    { label: 'B', value: 40, color: '#22c55e' },
  ]
</script>

<!-- Loading skeleton -->
<tc-slices-card loading title="Downloads"></tc-slices-card>
```

---