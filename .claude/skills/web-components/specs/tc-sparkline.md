---
component: tc-sparkline
---

### tc-sparkline

Compact inline SVG micro-chart for quick trend display. Renders as a `<svg>` with `display: inline-block`, suitable for embedding within metric rows, prose, or dashboard cards. Supports line (polyline + endpoint dot) and bar (column) types. Purely presentational — no tooltips or interaction.

**Tag:** `tc-sparkline`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | string | — | Comma-separated number list (e.g. `"10,25,18,42"`). Parsed to an array of numbers. Ignored once the JS `data` property has been set. |
| `type` | `'line' \| 'bar'` | `'line'` | Chart type. `line` renders a polyline with an endpoint dot; `bar` renders evenly-spaced rect columns. |
| `color` | string | — | CSS color (any valid value, e.g. `"#6366f1"`, `"var(--tc-success)"`). When absent, defaults to `--tc-app-accent` via the SCSS token. |
| `height` | number | `32` | SVG height in px. |
| `width` | number | `120` | SVG width in px. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `number[]` | `[]` | Array of numbers to plot. Setting this takes precedence over the `data` attribute and triggers a re-render. |

**Events**

None. `tc-sparkline` is purely presentational.

**Slots**

None. All content is generated as inline SVG.

**Accessibility**

The inner `<svg>` carries `role="img"` and an `aria-label` summarising the trend direction (e.g. `"Trend from 10 to 75, upward"`). For decorative usage inside a labelled metric, add `aria-hidden="true"` directly to the element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-sparkline-color` | `var(--tc-app-accent)` | Stroke/fill color for the chart. Overridden by the `color` attribute via inline style. |

```html
<!-- Line chart via data attribute -->
<tc-sparkline data="10,25,18,42,30,55" width="120" height="32"></tc-sparkline>

<!-- Bar chart via JS property -->
<tc-sparkline id="bar" type="bar" width="120" height="32"></tc-sparkline>
<script>
    document.getElementById('bar').data = [12, 40, 28, 55, 38, 70, 45]
</script>

<!-- Custom color -->
<tc-sparkline data="5,30,20,60,45" color="var(--tc-success)" width="120" height="32"></tc-sparkline>

<!-- Inline within a metric sentence -->
<p>
    Revenue <strong>$42,180</strong>
    <tc-sparkline data="30,38,35,44,40,50,47,55" height="24" width="80"></tc-sparkline>
    <span style="color:var(--tc-success)">+12.4%</span>
</p>
```

---