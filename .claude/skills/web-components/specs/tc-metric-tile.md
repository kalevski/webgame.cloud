---
component: tc-metric-tile
---

### tc-metric-tile

Compact presentational card showing a single metric — a mono uppercase micro-label, a large value figure, an optional unit suffix, an optional leading icon, and an optional hint line. No interactive targets; purely data-display.

**Tag:** `tc-metric-tile`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | `""` | Metric caption — rendered as an uppercase JetBrains Mono micro-label above the value. |
| `value` | string | — | Metric value as text. When set, renders as the displayed figure. When absent, default slot children are distributed into the value element instead. |
| `unit` | string | — | Optional unit suffix rendered after the value in a smaller muted tone (e.g. `"ms"`, `"%"`, `"GB"`). |
| `icon` | string | — | Optional PascalCase lucide icon name (e.g. `"Activity"`, `"Zap"`) rendered as a leading inline SVG. Decorative — `aria-hidden`. |
| `hint` | string | — | Optional sub-text line beneath the value. When absent and a `slot="hint"` child is present, that child is distributed into the hint element instead. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Reflects the `label` attribute. |
| `value` | `string \| null` | Reflects the `value` attribute. |
| `unit` | `string \| null` | Reflects the `unit` attribute. |
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `hint` | `string \| null` | Reflects the `hint` attribute. |

**Events**

None. `tc-metric-tile` is a purely presentational element.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Rich value content. Used when the `value` attribute is absent. Distributed into `.tc-metric-tile-value`. |
| `hint` | Rich hint content. Used when the `hint` attribute is absent. Distributed into `.tc-metric-tile-hint`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-metric-tile-bg` | `var(--tc-surface)` | Card background. |
| `--bs-metric-tile-border-color` | `var(--tc-border)` | 1px hairline border color. |
| `--bs-metric-tile-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-metric-tile-padding-y` | `1rem` | Vertical inner padding. |
| `--bs-metric-tile-padding-x` | `1.25rem` | Horizontal inner padding. |
| `--bs-metric-tile-gap` | `0.75rem` | Gap between leading icon and body. |
| `--bs-metric-tile-icon-size` | `1.25rem` | Leading icon SVG width/height. |
| `--bs-metric-tile-icon-color` | `var(--tc-text-muted)` | Leading icon color. |
| `--bs-metric-tile-label-color` | `var(--tc-text-muted)` | Micro-label text color. |
| `--bs-metric-tile-label-font-size` | `0.6875rem` | Micro-label font size (~11px). |
| `--bs-metric-tile-label-letter-spacing` | `0.08em` | Micro-label letter spacing. |
| `--bs-metric-tile-value-color` | `var(--tc-text)` | Value figure text color. |
| `--bs-metric-tile-value-font-size` | `1.5rem` | Value figure font size. |
| `--bs-metric-tile-value-font-weight` | `600` | Value figure font weight (≤600). |
| `--bs-metric-tile-unit-color` | `var(--tc-text-muted)` | Unit suffix text color. |
| `--bs-metric-tile-unit-font-size` | `0.875rem` | Unit suffix font size. |
| `--bs-metric-tile-hint-color` | `var(--tc-text-faint, var(--tc-text-muted))` | Hint line text color. |
| `--bs-metric-tile-hint-font-size` | `0.75rem` | Hint line font size. |

```html
<!-- Label and value -->
<tc-metric-tile label="Total Users" value="12,480"></tc-metric-tile>

<!-- Value with unit -->
<tc-metric-tile label="Avg Response" value="142" unit="ms"></tc-metric-tile>

<!-- With icon -->
<tc-metric-tile label="Revenue" value="$24,500" icon="DollarSign"></tc-metric-tile>

<!-- With hint -->
<tc-metric-tile label="Error Rate" value="0.4" unit="%" hint="Down 0.1% from last week"></tc-metric-tile>

<!-- Grid of tiles -->
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
  <tc-metric-tile label="Requests" value="3.2M" icon="Activity" hint="Last 24 hours"></tc-metric-tile>
  <tc-metric-tile label="Uptime" value="99.97" unit="%" icon="CheckCircle"></tc-metric-tile>
  <tc-metric-tile label="Latency P99" value="320" unit="ms" icon="Zap"></tc-metric-tile>
  <tc-metric-tile label="Active Sessions" value="1,804"></tc-metric-tile>
</div>

<!-- Slotted value (rich content) -->
<tc-metric-tile label="Build Status">
  <strong style="color:var(--tc-success)">Passing</strong>
</tc-metric-tile>

<!-- Slotted hint -->
<tc-metric-tile label="Open Tickets" value="42">
  <span slot="hint" style="color:var(--tc-danger)">3 critical</span>
</tc-metric-tile>
```

---