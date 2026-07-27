---
component: tc-stat-card
---

### tc-stat-card

Statistic card with label, value, optional icon, delta indicator, helper text, and footer row. Presentational only — no events.

**Tag:** `tc-stat-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon` | `string \| null` | `null` | Lucide icon name (PascalCase, e.g. `"DollarSign"`). Rendered as an inline SVG tile. |
| `label` | `string` | `''` | Small caption above the value (required-ish). |
| `value` | `string \| null` | `null` | Headline figure as a string. When absent, falls back to slotted children. |
| `unit` | `string \| null` | `null` | Short suffix rendered next to the value (e.g. `"ms"`, `"%"`). |
| `delta` | `string \| null` | `null` | Change text (e.g. `"+12%"`). |
| `delta-kind` | `'up' \| 'down' \| 'neutral'` | `'neutral'` | Governs delta colour and directional arrow icon. |
| `helper` | `string \| null` | `null` | Small helper line displayed below the delta. |
| `footer` | `string \| null` | `null` | Text in a bottom footer row, separated from the body by a hairline. |
| `loading` | boolean | `false` | When set, replaces card content with an animated skeleton placeholder. |

**JS Properties**

Each attribute has a reflected JS property of the same name (camelCase where needed):

| Property | Type |
|----------|------|
| `icon` | `string \| null` |
| `label` | `string` |
| `value` | `string \| null` |
| `unit` | `string \| null` |
| `delta` | `string \| null` |
| `deltaKind` | `StatCardDeltaKind` |
| `helper` | `string \| null` |
| `footer` | `string \| null` |
| `loading` | `boolean` |

**Events**

None. `tc-stat-card` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Rich value content. Used when the `value` attribute is absent. Distributed into `.tc-stat-card-value`. |

**Accessibility**

- The delta badge carries an `aria-label` describing direction and value (e.g. `"trending up +12%"`).
- During loading, the host element receives `role="status"` and `aria-busy="true"`; the inner card receives `aria-hidden="true"`; a visually-hidden `Loading…` text is included for screen readers.
- `prefers-reduced-motion` freezes the skeleton shimmer to a static fill.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-stat-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-stat-card-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-stat-card-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-stat-card-padding-y` | `1rem` | Vertical inner padding. |
| `--bs-stat-card-padding-x` | `1.25rem` | Horizontal inner padding. |
| `--bs-stat-card-icon-size` | `1rem` | Icon SVG width/height. |
| `--bs-stat-card-icon-color` | `var(--tc-text-muted)` | Icon colour. |
| `--bs-stat-card-icon-tile-bg` | `var(--tc-surface-muted)` | Icon tile background. |
| `--bs-stat-card-label-color` | `var(--tc-text-muted)` | Label text colour. |
| `--bs-stat-card-label-font-size` | `0.6875rem` | Label font size. |
| `--bs-stat-card-value-color` | `var(--tc-text)` | Value text colour. |
| `--bs-stat-card-value-font-size` | `1.75rem` | Value font size. |
| `--bs-stat-card-value-font-weight` | `600` | Value font weight. |
| `--bs-stat-card-unit-color` | `var(--tc-text-muted)` | Unit suffix colour. |
| `--bs-stat-card-unit-font-size` | `0.9375rem` | Unit suffix font size. |
| `--bs-stat-card-delta-font-size` | `0.75rem` | Delta badge font size. |
| `--bs-stat-card-delta-icon-size` | `0.875rem` | Delta directional icon size. |
| `--bs-stat-card-helper-color` | `var(--tc-text-muted)` | Helper text colour. |
| `--bs-stat-card-helper-font-size` | `0.75rem` | Helper text font size. |
| `--bs-stat-card-footer-bg` | `var(--tc-surface-muted)` | Footer row background. |
| `--bs-stat-card-footer-color` | `var(--tc-text-muted)` | Footer text colour. |
| `--bs-stat-card-footer-font-size` | `0.75rem` | Footer text font size. |

```html
<!-- Basic: label + value -->
<tc-stat-card label="Total Users" value="12,480"></tc-stat-card>

<!-- With unit and icon -->
<tc-stat-card label="Avg Response" value="142" unit="ms" icon="Zap"></tc-stat-card>

<!-- Delta kinds -->
<tc-stat-card label="MRR" value="$42,100" delta="+8.3%" delta-kind="up" icon="DollarSign"></tc-stat-card>
<tc-stat-card label="Churn" value="2.1%" delta="+0.3%" delta-kind="down" icon="TrendingDown"></tc-stat-card>
<tc-stat-card label="NPS" value="72" delta="0%" delta-kind="neutral"></tc-stat-card>

<!-- With helper and footer -->
<tc-stat-card label="Error Rate" value="0.4" unit="%" delta="-0.1%" delta-kind="up"
    helper="Down 0.1 pp from last week"
    footer="Compared to previous 30 days">
</tc-stat-card>

<!-- Slotted value -->
<tc-stat-card label="Build Status">
    <strong style="color: var(--tc-success); font-size: 1.75rem">Passing</strong>
</tc-stat-card>

<!-- Loading skeleton -->
<tc-stat-card loading label="Users" value="0"></tc-stat-card>
```