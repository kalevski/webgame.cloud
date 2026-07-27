---
component: tc-scoring-rules
---

### tc-scoring-rules

Presentational list of scoring rules with optional icons, titles, descriptions, point values, and optional accent color markers. Set rules exclusively via the `rules` JS property. Non-interactive — no hover state, no events.

**Tag:** `tc-scoring-rules`

**Attributes**

None. All content is supplied via the `rules` JS property.

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rules` | `ScoringRule[]` | `[]` | Array of rule descriptors (see shape below). Re-renders the list on each set. |

**ScoringRule shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | `string` | no | Lucide icon name (kebab-case or PascalCase, e.g. `"star"` or `"Star"`). Rendered as inline SVG, `aria-hidden`. Omit to show no icon. |
| `title` | `string` | yes | Rule title — Inter 500, `--tc-text`. |
| `description` | `string` | yes | Secondary description line below the title — `--tc-text-muted`, smaller. |
| `points` | `string` | yes | Point value displayed in JetBrains Mono (e.g. `"+100"`). |
| `suffix` | `string` | no | Optional suffix appended after the point value in smaller muted mono text (e.g. `"pts"`). |
| `accent` | `"pink" \| "yellow" \| "cyan" \| "green" \| "red"` | no | Accent color applied as a 3px left border bar on the row and as the icon tint. |

**Events**

None. `tc-scoring-rules` is purely presentational.

**Slots**

None.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-scoring-rules-row-border-color` | `var(--tc-border)` | 1px hairline color between rows. |
| `--bs-scoring-rules-title-color` | `var(--tc-text)` | Rule title text color. |
| `--bs-scoring-rules-desc-color` | `var(--tc-text-muted)` | Rule description text color. |
| `--bs-scoring-rules-points-color` | `var(--tc-text)` | Points value text color. |
| `--bs-scoring-rules-icon-size` | `1.125rem` | Icon SVG width and height. |
| `--bs-scoring-rules-row-padding-y` | `0.75rem` | Vertical padding per row. |
| `--bs-scoring-rules-row-padding-x` | `1rem` | Horizontal padding per row. |
| `--bs-scoring-rules-accent-bar-width` | `3px` | Width of the left accent bar. |
| `--bs-scoring-rules-accent-pink` | `#ec4899` | Pink accent color. |
| `--bs-scoring-rules-accent-yellow` | `var(--tc-warning)` | Yellow accent color. |
| `--bs-scoring-rules-accent-cyan` | `var(--tc-accent-fg)` | Cyan accent color. |
| `--bs-scoring-rules-accent-green` | `var(--tc-success)` | Green accent color. |
| `--bs-scoring-rules-accent-red` | `var(--tc-danger)` | Red accent color. |

```html
<tc-scoring-rules id="rules"></tc-scoring-rules>

<script>
const el = document.getElementById('rules')
el.rules = [
    {
        icon: 'Star',
        title: 'First contribution',
        description: 'Submit your first accepted pull request.',
        points: '+100',
        suffix: 'pts',
    },
    {
        icon: 'GitPullRequest',
        title: 'Pull request merged',
        description: 'Earn points for each pull request that gets merged.',
        points: '+25',
        suffix: 'pts',
        accent: 'green',
    },
    {
        icon: 'Shield',
        title: 'Security fix',
        description: 'Report or patch a confirmed security vulnerability.',
        points: '+200',
        suffix: 'pts',
        accent: 'red',
    },
    {
        title: 'Daily login',
        description: 'Log in on any day to maintain your streak.',
        points: '+1',
        suffix: 'pt',
    },
]
</script>
```

---