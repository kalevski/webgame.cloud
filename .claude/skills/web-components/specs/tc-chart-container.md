---
component: tc-chart-container
---

### tc-chart-container

Chart wrapper with an optional header (title + subtitle on the left, actions on the right), a slotted chart body, a legend footer region, and loading/empty states. Renders as a `card`-styled surface with a subtle ink-gradient header cap, hairline border, and low shadow. Sharp corners throughout.

**Tag:** `tc-chart-container`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Card header title text (Inter weight 600). When absent (along with `subtitle` and `actions`), the header is hidden entirely. |
| `subtitle` | string | — | Muted subtitle text rendered below the title (12.5 px, `--tc-text-muted`). |
| `loading` | boolean | `false` | When present, replaces the body with a shimmer skeleton placeholder and hides the legend. Takes precedence over `empty`. |
| `empty` | boolean | `false` | When present (and `loading` is absent), replaces the body with the `emptySlot` content or a default "No data available" placeholder. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `legend` | `string \| Node \| null` | `null` | HTML string or DOM Node rendered into the `.tc-chart-container-legend` footer. Hidden when `loading` is true or when empty. |
| `actions` | `string \| Node \| null` | `null` | HTML string or DOM Node rendered into the `.tc-chart-container-actions` region on the right side of the header. |
| `emptySlot` | `string \| Node \| null` | `null` | HTML string or DOM Node rendered inside the body when `empty` is true. Falls back to a default "No data available" text when not provided. |

**Events**

None. `tc-chart-container` is a purely presentational wrapper.

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Chart body content (the chart itself, a canvas, an SVG, etc.). Preserved across re-renders inside `.tc-chart-container-body`. Hidden when `loading` or `empty` is true. |

**Accessibility**

The inner root div carries `role="group"` and `aria-label` tied to the `title` attribute when present. The loading skeleton carries `aria-busy="true"` and a visually-labelled status role. The empty placeholder uses descriptive text. Interactive controls placed in `actions` inherit the visible focus ring from the reset layer. Skeleton shimmer honours `prefers-reduced-motion`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-chart-container-bg` | `var(--tc-surface)` | Card background colour. |
| `--bs-chart-container-border-color` | `var(--tc-border)` | Hairline border colour. |
| `--bs-chart-container-shadow` | `var(--tc-shadow-sm)` | Box shadow at rest. |
| `--bs-chart-container-header-bg` | ink gradient | Subtle gradient cap applied to the header. |
| `--bs-chart-container-header-border-color` | `var(--tc-border)` | Separator hairline below the header. |
| `--bs-chart-container-header-padding-y` | `0.75rem` | Header vertical padding. |
| `--bs-chart-container-header-padding-x` | `1.25rem` | Header horizontal padding. |
| `--bs-chart-container-body-padding-y` | `1.25rem` | Body vertical padding. |
| `--bs-chart-container-body-padding-x` | `1.25rem` | Body horizontal padding. |
| `--bs-chart-container-legend-padding-y` | `0.625rem` | Legend footer vertical padding. |
| `--bs-chart-container-legend-padding-x` | `1.25rem` | Legend footer horizontal padding. |
| `--bs-chart-container-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-chart-container-subtitle-color` | `var(--tc-text-muted)` | Subtitle and legend text colour. |
| `--bs-chart-container-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton placeholder background. |
| `--bs-chart-container-empty-color` | `var(--tc-text-faint)` | Empty state text colour. |

```html
<!-- Basic: title + subtitle + slotted chart body -->
<tc-chart-container title="Monthly Revenue" subtitle="Jan – Jun 2025">
    <canvas id="my-chart" height="200"></canvas>
</tc-chart-container>

<!-- Loading state -->
<tc-chart-container title="Monthly Revenue" loading></tc-chart-container>

<!-- Empty state (default placeholder) -->
<tc-chart-container title="Monthly Revenue" empty></tc-chart-container>

<!-- JS properties: legend and actions -->
<tc-chart-container id="chart" title="Portfolio" subtitle="Last 12 months">
    <canvas id="portfolio-chart" height="200"></canvas>
</tc-chart-container>
<script>
    const el = document.getElementById('chart')
    el.legend = '<span style="font-size:0.75rem;color:var(--tc-text-muted)">&#9679; Series A &nbsp; &#9675; Series B</span>'
    el.actions = '<button type="button">Export</button>'
</script>

<!-- Custom empty slot -->
<tc-chart-container id="chart-empty" title="Revenue" empty></tc-chart-container>
<script>
    document.getElementById('chart-empty').emptySlot = '<span>No records for the selected date range.</span>'
</script>
```

---