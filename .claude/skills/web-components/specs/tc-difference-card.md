---
component: tc-difference-card
---

### tc-difference-card

Dashboard metric card showing a prominent value with a directional percentage-delta chip (vs the previous period). Purely presentational; no events.

**Tag:** `tc-difference-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | `""` | Metric name label (muted, shown above the value). Required. |
| `value` | `number` | `0` | Current metric value. Required. |
| `previous-value` | `number` | `0` | Prior-period value used to compute the percentage delta. Required. When `0`, the delta chip shows `—` (no valid baseline). |
| `period` | `string` | — | Optional caption rendered below the metric row (e.g. `"vs last month"`). |
| `loading` | `boolean` | `false` | When present, renders a shimmer skeleton placeholder in place of content. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Reflects the `title` attribute. |
| `value` | `number` | Reflects the `value` attribute (parsed as float). |
| `previousValue` | `number` | Reflects the `previous-value` attribute (parsed as float). |
| `period` | `string \| null` | Reflects the `period` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `formatValue` | `((v: number) => string) \| null` | Optional formatter function applied to the displayed `value`. Default format: ≥1 000 000 → `"1.2M"`, ≥1 000 → `"1.2K"`, else `toLocaleString()`. Set via JS property — not an attribute. Re-renders on assignment. |

**Events**

None. `tc-difference-card` is purely presentational.

**Slots**

None. Content is driven entirely by HTML attributes and the `formatValue` JS property.

**Accessibility**

- The directional delta icon carries `aria-hidden="true"` — direction is conveyed by the icon **and** the `+`/`-` sign prefix in the text, not color alone.
- The loading state sets `aria-busy="true"` on the host and includes a visually-hidden `role="status"` announcement.
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-difference-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-difference-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-difference-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-difference-card-padding-y` | `1rem` | Vertical card body padding. |
| `--bs-difference-card-padding-x` | `1.25rem` | Horizontal card body padding. |
| `--bs-difference-card-title-color` | `var(--tc-text-muted)` | Metric name label color. |
| `--bs-difference-card-value-color` | `var(--tc-text)` | Prominent value text color. |
| `--bs-difference-card-value-font-size` | `1.5rem` | Prominent value font size. |
| `--bs-difference-card-period-color` | `var(--tc-text-muted)` | Period caption text color. |
| `--bs-difference-card-delta-gap` | `0.25rem` | Gap between the icon and text inside the delta chip. |
| `--bs-difference-card-delta-icon-size` | `0.875rem` | Width/height of the directional icon inside the delta chip. |
| `--bs-difference-card-delta-font-size` | `0.75rem` | Font size of the percentage text in the delta chip. |
| `--bs-difference-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton placeholder fill color. |
| `--bs-difference-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight color. |

```html
<!-- Positive delta (up) -->
<tc-difference-card title="Monthly Revenue" value="12500" previous-value="10000" period="vs last month"></tc-difference-card>

<!-- Negative delta (down) -->
<tc-difference-card title="Active Users" value="8200" previous-value="10000" period="vs last week"></tc-difference-card>

<!-- Flat / no change -->
<tc-difference-card title="Error Rate" value="10000" previous-value="10000" period="vs yesterday"></tc-difference-card>

<!-- Custom formatValue via JS property -->
<tc-difference-card id="sales" title="Total Sales" value="1250000" previous-value="1000000" period="vs Q1"></tc-difference-card>
<script>
    document.getElementById('sales').formatValue =
        v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
</script>

<!-- Loading skeleton -->
<tc-difference-card title="Placeholder" value="0" previous-value="0" loading></tc-difference-card>
```

---