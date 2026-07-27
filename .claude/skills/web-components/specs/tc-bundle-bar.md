---
component: tc-bundle-bar
---

### tc-bundle-bar

Segmented progress bar for build / bundle visualisation. Renders a discrete row of cells where the first N are filled, with an optional header row (name + meta) and an optional row of chip labels.

**Tag:** `tc-bundle-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `segments` | number | `10` | Total number of discrete segment cells in the track. |
| `filled-segments` | number | `0` | Number of cells that are filled (clamped to `[0, segments]`). |
| `name` | string | — | Label displayed on the left side of the header row. When omitted, the `slot="name"` region is used. |
| `meta` | string | — | Monospace text displayed on the right side of the header row (e.g. `"4 / 10"`, `"65%"`). When omitted, the `slot="meta"` region is used. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `segments` | `number` | Reflects the `segments` attribute. |
| `filledSegments` | `number` | Reflects the `filled-segments` attribute. |
| `name` | `string \| null` | Reflects the `name` attribute. |
| `meta` | `string \| null` | Reflects the `meta` attribute. |
| `chips` | `BundleBarChip[]` | Array of chip descriptors rendered below the track. Each chip has `label: string`, optional `value?: string \| number`, and optional `color?: string` (CSS color applied as the chip accent). Setting this property triggers a re-render. |

**Events**

None. `tc-bundle-bar` is a purely presentational element.

**Slots**

| Slot | Description |
|------|-------------|
| `name` | Rich content for the header name region. Used when the `name` attribute is absent. |
| `meta` | Rich content for the header meta region. Used when the `meta` attribute is absent. |

**Accessibility**

The segment track carries `role="progressbar"` with `aria-valuenow` (filled count), `aria-valuemin="0"`, `aria-valuemax` (total segments), and `aria-label` derived from the `name` attribute when present.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-bundle-bar-segment-bg` | `var(--tc-surface-muted)` | Background of unfilled segment cells. |
| `--bs-bundle-bar-segment-filled-bg` | `var(--tc-app-accent)` | Background of filled segment cells. |
| `--bs-bundle-bar-segment-height` | `0.5rem` | Height of the track. |
| `--bs-bundle-bar-segment-gap` | `1px` | Hairline gap between segment cells. |
| `--bs-bundle-bar-name-color` | `var(--tc-text)` | Header name text colour. |
| `--bs-bundle-bar-meta-color` | `var(--tc-text-muted)` | Header meta text colour. |
| `--bs-bundle-bar-chip-bg` | `var(--tc-surface-muted)` | Chip label background. |
| `--bs-bundle-bar-chip-border-color` | `var(--tc-border)` | Chip hairline border and default value-area background. |
| `--bs-bundle-bar-chip-text-color` | `var(--tc-text)` | Chip label text colour. |
| `--bs-bundle-bar-chip-font-size` | `0.72rem` | Chip font size. |

```html
<!-- Simple fill ratio with name and meta -->
<tc-bundle-bar segments="10" filled-segments="4" name="Build progress" meta="4 / 10"></tc-bundle-bar>

<!-- Track only (no header) -->
<tc-bundle-bar segments="12" filled-segments="9"></tc-bundle-bar>

<!-- chips property set via JavaScript -->
<tc-bundle-bar id="bar" segments="10" filled-segments="7" name="dist/app" meta="3.8 MB"></tc-bundle-bar>
<script>
    document.getElementById('bar').chips = [
        { label: 'main',   value: '2.4 MB' },
        { label: 'vendor', value: '1.1 MB' },
        { label: 'lazy',   value: '320 KB' },
    ]
</script>

<!-- Chips with color accents (e.g. test results) -->
<tc-bundle-bar id="tests" segments="15" filled-segments="14" name="Test suite" meta="142 / 153"></tc-bundle-bar>
<script>
    document.getElementById('tests').chips = [
        { label: 'passed',  value: '142', color: '#16a34a' },
        { label: 'failed',  value: '3',   color: '#dc2626' },
        { label: 'skipped', value: '8' },
    ]
</script>

<!-- Named slots -->
<tc-bundle-bar segments="8" filled-segments="5">
    <strong slot="name">Custom name</strong>
    <em slot="meta">slot meta</em>
</tc-bundle-bar>
```

---