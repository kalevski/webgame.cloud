---
component: tc-hero-stats-bar
---

### tc-hero-stats-bar

Horizontal bar of key-value statistics with optional units and zero-state styling. Items are separated by 1px hairline dividers; each item stacks a large mono value (with optional unit suffix) above an uppercase mono micro-label. Values of `0`, `'0'`, or empty are muted via the zero-state modifier. No events emitted — purely presentational. Set stats via the JS `stats` property.

**Tag:** `tc-hero-stats-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `class-name` | string | — | Extra CSS class(es) merged onto the inner `.tc-hero-stats-bar` wrapper div. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `stats` | `HeroStat[]` | Array of stat objects to render. Setting this property triggers a re-render. |

**HeroStat shape**

```ts
interface HeroStat {
    label: string            // uppercase mono micro-label below the value
    value: string | number   // large mono number/text; 0/'0'/'' triggers zero-state
    unit?: string            // optional smaller mono suffix appended to the value
}
```

**Events**

None.

**Slots**

None.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-hero-stats-bar-item-padding-x` | `1.25rem` | Horizontal padding on each item. |
| `--bs-hero-stats-bar-item-padding-y` | `0.875rem` | Vertical padding on each item. |
| `--bs-hero-stats-bar-value-font-size` | `1.5rem` | Font size of the main value text. |
| `--bs-hero-stats-bar-value-font-weight` | `600` | Font weight of the main value text. |
| `--bs-hero-stats-bar-value-color` | `var(--tc-text)` | Color of the main value text. |
| `--bs-hero-stats-bar-unit-font-size` | `0.875rem` | Font size of the unit suffix. |
| `--bs-hero-stats-bar-unit-color` | `var(--tc-text-muted)` | Color of the unit suffix. |
| `--bs-hero-stats-bar-label-font-size` | `0.6875rem` | Font size of the micro-label. |
| `--bs-hero-stats-bar-label-color` | `var(--tc-text-muted)` | Color of the micro-label. |
| `--bs-hero-stats-bar-divider-color` | `var(--tc-border)` | Color of the 1px hairline dividers between items. |
| `--bs-hero-stats-bar-zero-color` | `var(--tc-text-faint)` | Value color when the stat is in the zero state. |

**Examples**

```html
<!-- Basic stats -->
<tc-hero-stats-bar id="stats"></tc-hero-stats-bar>
<script>
document.getElementById('stats').stats = [
    { label: 'Total Users', value: 12847 },
    { label: 'Active Today', value: 3201 },
    { label: 'Requests', value: '1.2M' },
    { label: 'Error Rate', value: '0.04%' },
]
</script>

<!-- With units -->
<tc-hero-stats-bar id="perf"></tc-hero-stats-bar>
<script>
document.getElementById('perf').stats = [
    { label: 'Latency (p50)', value: 42, unit: 'ms' },
    { label: 'Latency (p99)', value: 198, unit: 'ms' },
    { label: 'Uptime', value: 99.97, unit: '%' },
]
</script>

<!-- Zero-state (value 0, '0', or '' mutes the color) -->
<tc-hero-stats-bar id="zero"></tc-hero-stats-bar>
<script>
document.getElementById('zero').stats = [
    { label: 'Deployments', value: 7 },
    { label: 'Failures', value: 0 },
    { label: 'Alerts', value: '' },
]
</script>
```

---