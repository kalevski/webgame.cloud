---
component: tc-stats-screen
---

### tc-stats-screen

End-of-match statistics panel. Styled to the toolcase design system: slate surface, sharp corners, 1px hairline borders, JetBrains Mono for machine-facing stat values, muted prose palette for labels. The slate neutral ramp carries the panel. All cosmetics flow through `--bs-stats-screen-*` custom properties. Purely presentational — no events, no slots.

**Tag:** `tc-stats-screen`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `screen-title` | string | `'Stats'` | Title displayed in the header beneath the "Statistics" eyebrow. |
| `summary` | string | `''` | Optional prose note shown below the title separator. Omit or leave empty to hide. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `screenTitle` | `string` | `'Stats'` | Reflects the `screen-title` attribute. |
| `summary` | `string` | `''` | Reflects the `summary` attribute. |
| `sections` | `StatsSection[]` | `[]` | Array of stat sections. Each section has a `title` string and a `stats` array of `{ label: string; value: string \| number }`. Number values are formatted with `toLocaleString()`. Setting this property triggers a re-render. |

**Events**

`tc-stats-screen` fires no events — it is purely presentational.

**Slots**

`tc-stats-screen` has no slots. All content is driven by attributes and the `sections` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-stats-screen-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-stats-screen-border` | `var(--tc-border)` | Outer 1px hairline border. |
| `--bs-stats-screen-max-width` | `480px` | Maximum panel width. |
| `--bs-stats-screen-padding-x` | `1.5rem` | Horizontal padding for the header and stat rows. |
| `--bs-stats-screen-padding-y` | `1.75rem` | Vertical padding for the root panel. |
| `--bs-stats-screen-gap` | `1.25rem` | Gap between panel sections. |
| `--bs-stats-screen-header-bg` | `var(--tc-surface-muted)` | Header block background. |
| `--bs-stats-screen-header-border` | `var(--tc-border)` | Bottom border of the header block. |
| `--bs-stats-screen-header-padding-y` | `1.25rem` | Header vertical padding. |
| `--bs-stats-screen-eyebrow-color` | `var(--tc-text-muted)` | "Statistics" eyebrow label colour. |
| `--bs-stats-screen-eyebrow-size` | `10.5px` | Eyebrow font size. |
| `--bs-stats-screen-title-color` | `var(--tc-text)` | Title colour. |
| `--bs-stats-screen-title-size` | `1.125rem` | Title font size. |
| `--bs-stats-screen-title-weight` | `600` | Title font weight. |
| `--bs-stats-screen-summary-color` | `var(--tc-text-muted)` | Summary text colour. |
| `--bs-stats-screen-separator-color` | `var(--tc-border)` | Colour of the 1px hairline separator below the title. |
| `--bs-stats-screen-section-border` | `var(--tc-border)` | Bottom border between sections. |
| `--bs-stats-screen-section-title-color` | `var(--tc-text-faint)` | Section title (eyebrow) colour. |
| `--bs-stats-screen-section-title-size` | `10.5px` | Section title font size. |
| `--bs-stats-screen-stat-border` | `var(--tc-border)` | Top hairline border on each stat row. |
| `--bs-stats-screen-stat-label-color` | `var(--tc-text-muted)` | Stat label (left column) colour. |
| `--bs-stats-screen-stat-value-color` | `var(--tc-text)` | Stat value (right column) colour. |
| `--bs-stats-screen-stat-value-size` | `0.9375rem` | Stat value font size. |
| `--bs-stats-screen-stat-value-weight` | `600` | Stat value font weight. |

**Example**

```html
<tc-stats-screen
    id="stats"
    screen-title="Match Complete"
    summary="Victory — Capture the Flag · EU-West"
></tc-stats-screen>

<script>
    const stats = document.getElementById('stats')

    stats.sections = [
        {
            title: 'Performance',
            stats: [
                { label: 'Kills', value: 24 },
                { label: 'Deaths', value: 7 },
                { label: 'Assists', value: 11 },
                { label: 'K/D Ratio', value: '3.43' },
            ],
        },
        {
            title: 'Accuracy',
            stats: [
                { label: 'Shots Fired', value: 1847 },
                { label: 'Accuracy', value: '49.97%' },
            ],
        },
    ]
</script>
```

---