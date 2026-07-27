---
component: tc-stat-row
---

### tc-stat-row

Label + value stat row with an optional trend indicator. Styled to the toolcase design system with slate neutrals, JetBrains Mono values, and 1px hairline separators. Purely presentational; attribute-driven with no events and no slots. All cosmetics flow through `--bs-stat-row-*` custom properties.

**Tag:** `tc-stat-row`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `label` | string | `""` | Row label shown on the left side in an uppercase JetBrains Mono micro-label. |
| `value` | string \| number | `""` | Value shown on the right. Pure numeric strings are formatted with `toLocaleString()`. |
| `accent` | string | `""` | CSS color value written to `--bs-stat-row-accent` on the host. Applied as a colored left-edge stripe. |
| `trend` | number \| null | `null` | Numeric delta. When non-zero, renders a `TrendingUp`/`TrendingDown` Lucide icon + the absolute value. |

#### JS Properties

| Property | Type | Notes |
|---|---|---|
| `label` | `string` | Reflects the `label` attribute. |
| `value` | `string \| number` | Reflects the `value` attribute. Numbers are converted to string via `String()`. |
| `accent` | `string` | Reflects the `accent` attribute. |
| `trend` | `number \| null` | Reflects the `trend` attribute; parsed to `float`; `null` when absent or non-numeric. |

#### Events

None. `tc-stat-row` is a purely presentational element.

#### Slots

None. All content is driven by attributes.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-stat-row-bg` | `transparent` | Row background. |
| `--bs-stat-row-border-color` | `var(--tc-border)` | 1px hairline bottom-separator color. |
| `--bs-stat-row-padding-y` | `0.5rem` | Vertical inner padding. |
| `--bs-stat-row-padding-x` | `0.75rem` | Horizontal inner padding. |
| `--bs-stat-row-gap` | `0.5rem` | Gap between label and value, and between value and trend chip. |
| `--bs-stat-row-accent` | `transparent` | Left-edge stripe color (set inline by the `accent` attribute). |
| `--bs-stat-row-accent-width` | `3px` | Width of the left-edge accent stripe. |
| `--bs-stat-row-label-color` | `var(--tc-text-muted)` | Label text color. |
| `--bs-stat-row-label-font-size` | `0.6875rem` | Label font size (~11 px). |
| `--bs-stat-row-label-letter-spacing` | `0.08em` | Label letter spacing. |
| `--bs-stat-row-value-color` | `var(--tc-text)` | Value text color. |
| `--bs-stat-row-value-font-size` | `0.925rem` | Value font size. |
| `--bs-stat-row-value-font-weight` | `600` | Value font weight. |
| `--bs-stat-row-trend-font-size` | `0.75rem` | Trend chip text size. |
| `--bs-stat-row-trend-icon-size` | `0.875rem` | Trend icon width/height. |
| `--bs-stat-row-trend-gap` | `0.25rem` | Gap between trend icon and trend text. |
| `--bs-stat-row-trend-up-color` | `var(--tc-success)` | Trend chip color when `trend > 0`. |
| `--bs-stat-row-trend-down-color` | `var(--tc-danger)` | Trend chip color when `trend < 0`. |

#### Example

```html
<!-- Basic rows inside a hairline-bordered container -->
<div style="border: 1px solid var(--tc-border)">
  <tc-stat-row label="Score" value="12450"></tc-stat-row>
  <tc-stat-row label="Kills" value="18" trend="3"></tc-stat-row>
  <tc-stat-row label="Deaths" value="5" trend="-1"></tc-stat-row>
</div>

<!-- With accent color -->
<tc-stat-row label="HP" value="340 / 400" accent="var(--tc-success)"></tc-stat-row>

<script>
  const el = document.querySelector('tc-stat-row')
  el.label = 'Total Score'
  el.value = 99999
  el.trend = 1500
  el.accent = 'var(--tc-app-accent)'
</script>
```

---