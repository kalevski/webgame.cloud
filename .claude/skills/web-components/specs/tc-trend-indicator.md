---
component: tc-trend-indicator
---

### tc-trend-indicator

Trend badge with a directional arrow icon and formatted value. Direction is determined by the explicit `direction` attribute or inferred from the numeric sign of `value`. Three sizes scale icon and text together. When no `value` attribute is set, light-DOM child nodes are projected as the value content (rich markup). Purely presentational — no interaction, no events.

**Tag:** `tc-trend-indicator`

**Preset alias:** `tc-leaderboard-trend` is an alias of `tc-trend-indicator` (it accepts `direction="flat"` as a synonym of `neutral`). Everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `""` | The displayed value text (e.g. `"+12%"`, `"-8.3"`, `"0"`). When `direction` is absent and the value parses to a number, direction is inferred from its sign. When omitted entirely, slotted child nodes are used as the value content. |
| `direction` | `'up' \| 'down' \| 'neutral' \| 'flat'` | inferred | Explicit direction. Overrides sign inference. `flat` is a synonym of `neutral`. When absent, positive numbers → `up`, negative → `down`, zero or non-numeric → `neutral`. |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | Scale variant — adjusts icon size, font size, and gap together. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string \| null` | Reflects the `value` attribute. |
| `direction` | `TrendDirection \| null` | Reflects the `direction` attribute. `null` when the attribute is absent (direction is then inferred at render time). |
| `size` | `TrendSize` | Reflects the `size` attribute. Defaults to `'default'` when the attribute is absent or invalid. |

**Events**

None. `tc-trend-indicator` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Value content used when the `value` attribute is absent. Projected into the inner `.tc-trend-indicator-value` span (e.g. `<strong>+5</strong> pts`). |

**Accessibility**

The host element receives an auto-generated `aria-label` combining direction and value (e.g. `"trending up +12%"`). The icon SVG carries `aria-hidden="true"` — the label text conveys meaning without relying on color alone.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-trend-indicator-color` | direction-mapped | Text and icon color. `up` → `--tc-success`, `down` → `--tc-danger`, `neutral` → `--tc-text-muted`. |
| `--bs-trend-indicator-icon-size` | `1rem` | Icon width and height (scales with size variant). |
| `--bs-trend-indicator-font-size` | `0.8125rem` | Value text font size (scales with size variant). |
| `--bs-trend-indicator-gap` | `0.25rem` | Gap between icon and value text. |

```html
<!-- Explicit direction -->
<tc-trend-indicator value="+12%" direction="up"></tc-trend-indicator>
<tc-trend-indicator value="-8%" direction="down"></tc-trend-indicator>
<tc-trend-indicator value="0%" direction="neutral"></tc-trend-indicator>

<!-- Sign-inferred direction (no direction attribute) -->
<tc-trend-indicator value="42"></tc-trend-indicator>
<tc-trend-indicator value="-17"></tc-trend-indicator>
<tc-trend-indicator value="0"></tc-trend-indicator>

<!-- Three sizes -->
<tc-trend-indicator value="+5%" direction="up" size="small"></tc-trend-indicator>
<tc-trend-indicator value="+5%" direction="up" size="default"></tc-trend-indicator>
<tc-trend-indicator value="+5%" direction="up" size="large"></tc-trend-indicator>

<!-- Inline within a metric row -->
<p>
    Revenue <strong>$42,180</strong>
    <tc-trend-indicator value="+12.4%" direction="up" size="small"></tc-trend-indicator>
</p>
```

---