---
component: tc-metric-card
---

### tc-metric-card

Dashboard card showing a prominent metric with optional icon chip, subtitle, and inline SVG sparkline. Purely presentational — no events.

**Tag:** `tc-metric-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | `''` | Metric label displayed above the value (micro-caps style). Required. |
| `value` | `string` | `''` | Prominent headline figure (the metric itself). Required. |
| `subtitle` | `string \| null` | `null` | Muted supporting line displayed below the value. |
| `icon` | `string \| null` | `null` | Lucide icon name (PascalCase, e.g. `"TrendingUp"`). Rendered as a slate icon chip. |
| `trend-color` | `string \| null` | `null` | Any CSS color applied to the sparkline stroke. Defaults to `--tc-text-muted` when absent. |
| `loading` | boolean | `false` | When set, replaces card content with an animated skeleton placeholder. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Reflected from the `title` attribute (native `HTMLElement.title`). |
| `value` | `string` | Reflected from the `value` attribute. |
| `subtitle` | `string \| null` | Reflected from the `subtitle` attribute. |
| `icon` | `string \| null` | Reflected from the `icon` attribute. |
| `trend` | `number[]` | Array of data points to plot as a sparkline. JS property only — not an attribute. Setting re-renders the sparkline. |
| `trendColor` | `string \| null` | Reflected from the `trend-color` attribute. |
| `loading` | `boolean` | Reflected from the `loading` boolean attribute. |

**Events**

None. `tc-metric-card` is purely presentational.

**Slots**

None. Driven entirely by attributes and the `trend` JS property.

**Accessibility**

- The sparkline SVG carries `aria-hidden="true"`; the metric value is conveyed by the visible text, not the chart.
- The icon chip carries `aria-hidden="true"` — decorative only.
- During loading, the host receives `role="status"` and `aria-busy="true"`; the inner card receives `aria-hidden="true"`; a visually-hidden `Loading…` span is present for screen readers.
- `prefers-reduced-motion` freezes the skeleton shimmer to a static fill.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-metric-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-metric-card-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-metric-card-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-metric-card-padding-y` | `1rem` | Vertical inner padding. |
| `--bs-metric-card-padding-x` | `1.25rem` | Horizontal inner padding. |
| `--bs-metric-card-icon-chip-bg` | `var(--tc-surface-muted)` | Icon chip background (slate, not coloured). |
| `--bs-metric-card-icon-color` | `var(--tc-text-muted)` | Icon colour. |
| `--bs-metric-card-icon-size` | `1rem` | Icon SVG width/height. |
| `--bs-metric-card-title-color` | `var(--tc-text-muted)` | Title label colour. |
| `--bs-metric-card-title-font-size` | `0.6875rem` | Title label font size. |
| `--bs-metric-card-value-color` | `var(--tc-text)` | Headline value colour. |
| `--bs-metric-card-value-font-size` | `1.75rem` | Headline value font size. |
| `--bs-metric-card-value-font-weight` | `600` | Headline value font weight. |
| `--bs-metric-card-subtitle-color` | `var(--tc-text-muted)` | Subtitle colour. |
| `--bs-metric-card-subtitle-font-size` | `0.75rem` | Subtitle font size. |
| `--bs-metric-card-trend` | `var(--tc-text-muted)` | Sparkline stroke colour. Overridden by the `trend-color` attribute via inline style. |
| `--bs-metric-card-spark-height` | `2rem` | Sparkline SVG rendered height. |

```html
<!-- Basic: title + value -->
<tc-metric-card title="Monthly Revenue" value="$42,100"></tc-metric-card>

<!-- With icon and subtitle -->
<tc-metric-card title="Active Users" value="8,340" subtitle="Last 30 days" icon="Users"></tc-metric-card>

<!-- With sparkline trend (JS property) -->
<tc-metric-card id="mc" title="Weekly Sessions" value="3,640" icon="TrendingUp"></tc-metric-card>
<script>
  document.getElementById('mc').trend = [12, 28, 20, 45, 35, 60, 50, 72]
</script>

<!-- Custom trend color -->
<tc-metric-card id="mc2" title="Error Rate" value="2.4%" trend-color="var(--tc-danger)"></tc-metric-card>
<script>
  document.getElementById('mc2').trend = [80, 65, 70, 55, 60, 45, 50, 35]
</script>

<!-- Loading skeleton -->
<tc-metric-card loading title="Revenue" value="0"></tc-metric-card>
```
```

---