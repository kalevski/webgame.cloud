---
component: tc-colored-card
---

### tc-colored-card

Dashboard card with a caller-supplied color tinting the icon chip and a two-line metric display. Purely presentational; no events.

> **Alias of `tc-basic-card`.** `tc-colored-card` is registered as a thin subclass of `tc-basic-card`: `value` / `text` map to `text-a` / `text-b`, and `color` tints the icon chip. Theme it via the `--bs-basic-card-*` custom properties (the `--bs-colored-card-*` names below are retained only as a guide and resolve through the basic-card vars).

**Tag:** `tc-colored-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | `""` | Metric label (muted, shown below the value). Required. |
| `value` | `string \| number` | `""` | Metric value (prominent, shown above the label). Required. |
| `icon` | `string` | — | Lucide icon name in PascalCase (e.g. `"TrendingUp"`, `"Users"`). When absent, no icon chip is rendered. |
| `color` | `string` | — | Any CSS color (`"#22c55e"`, `"rgb(…)"`, `"var(--tc-success)"`). Tints the icon chip background (soft 12% tint) and sets the icon glyph color. Required for the colored effect; falls back to slate muted when absent. |
| `loading` | `boolean` | `false` | When present, renders a shimmer skeleton placeholder in place of content. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | Reflects the `text` attribute. |
| `value` | `string \| number` | Reflects the `value` attribute (setter converts to string). |
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `color` | `string \| null` | Reflects the `color` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |

**Events**

None. `tc-colored-card` is purely presentational.

**Slots**

None. Content is driven entirely by HTML attributes.

**Accessibility**

- The icon chip carries `aria-hidden="true"` — it is decorative; color is not the only carrier of information (value and label remain plain text).
- The loading state sets `aria-busy="true"` on the host and includes a visually-hidden `role="status"` announcement.
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill; the region remains visible).
- The colored chip uses a 12% tint background, ensuring adequate contrast between the full-color glyph and the soft tint.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-colored-card-accent` | `var(--tc-text-muted)` | Accent color applied to the icon glyph and chip tint background. Set via the `color` attribute. |
| `--bs-colored-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-colored-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-colored-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-colored-card-padding-y` | `1rem` | Vertical card body padding. |
| `--bs-colored-card-padding-x` | `1.25rem` | Horizontal card body padding. |
| `--bs-colored-card-gap` | `0.875rem` | Gap between icon chip and text block. |
| `--bs-colored-card-icon-size` | `2.75rem` | Width and height of the icon chip. |
| `--bs-colored-card-icon-svg-size` | `1.25rem` | Icon SVG width/height inside the chip. |
| `--bs-colored-card-value-color` | `var(--tc-text)` | Metric value text color. |
| `--bs-colored-card-value-font-size` | `1.375rem` | Metric value font size. |
| `--bs-colored-card-text-color` | `var(--tc-text-muted)` | Metric label text color. |
| `--bs-colored-card-text-font-size` | `0.8125rem` | Metric label font size. |
| `--bs-colored-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton placeholder fill color. |
| `--bs-colored-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight color. |

```html
<!-- Revenue metric (green) -->
<tc-colored-card icon="TrendingUp" value="$48,200" text="Total revenue" color="#22c55e"></tc-colored-card>

<!-- Active users metric (blue) -->
<tc-colored-card icon="Users" value="3,821" text="Active users this week" color="#3b82f6"></tc-colored-card>

<!-- Loading state -->
<tc-colored-card loading icon="BarChart2" value="—" text="placeholder" color="#6366f1"></tc-colored-card>
```

---