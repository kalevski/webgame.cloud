---
component: tc-compatibility-matrix
---

### tc-compatibility-matrix

**Tag:** `tc-compatibility-matrix`

Matrix table showing compatibility status across versions (rows) and platforms (columns) with status icons and a legend. Purely presentational — no events.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Optional heading rendered above the table. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string \| null` | `null` | Reflects the `title` attribute. |
| `versions` | `string[]` | `[]` | Row keys (version labels). Setting re-renders. |
| `platforms` | `string[]` | `[]` | Column keys (platform labels). Setting re-renders. |
| `support` | `Record<string, Record<string, CompatStatus>>` | `{}` | Nested map `support[version][platform] = CompatStatus`. Setting re-renders. Missing entries render as `'unknown'`. |

**`CompatStatus` values**

| Value | Icon | Color |
|-------|------|-------|
| `'yes'` | lucide `check` | `--tc-success` |
| `'no'` | lucide `x` | `--tc-danger` |
| `'partial'` | lucide `minus` | `--tc-warning` |
| `'unknown'` | lucide `help-circle` | `--tc-text-faint` (muted) |

**Events**

None. `tc-compatibility-matrix` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich heading content when the `title` attribute is absent. Use `<span slot="title">…</span>`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-compatibility-matrix-border` | `1px solid var(--tc-border)` | Outer frame and major dividers. |
| `--bs-compatibility-matrix-inner-border` | `1px solid var(--tc-slate-100)` | Between-row hairlines. |
| `--bs-compatibility-matrix-bg` | `var(--tc-surface)` | Table background. |
| `--bs-compatibility-matrix-head-bg` | `var(--tc-surface-muted)` | Platform header row background. |
| `--bs-compatibility-matrix-version-bg` | `var(--tc-surface-muted)` | Sticky version column background. |
| `--bs-compatibility-matrix-indicator-size` | `1rem` | Status icon size. |
| `--bs-compatibility-matrix-yes-color` | `var(--tc-success)` | "Supported" icon color. |
| `--bs-compatibility-matrix-no-color` | `var(--tc-danger)` | "Not supported" icon color. |
| `--bs-compatibility-matrix-partial-color` | `var(--tc-warning)` | "Partial support" icon color. |
| `--bs-compatibility-matrix-unknown-color` | `var(--tc-text-faint)` | "Unknown" icon color. |
| `--bs-compatibility-matrix-legend-bg` | `var(--tc-surface-muted)` | Legend strip background. |
| `--bs-compatibility-matrix-platform-label-font-size` | `0.6875rem` | Platform header label font size. |
| `--bs-compatibility-matrix-version-label-font-size` | `0.6875rem` | Version label font size. |

```html
<!-- Basic matrix covering all four statuses -->
<tc-compatibility-matrix id="cm" title="Browser Compatibility"></tc-compatibility-matrix>
<script>
  const el = document.getElementById('cm')
  el.versions = ['v1.0', 'v2.0', 'v3.0']
  el.platforms = ['Chrome', 'Firefox', 'Safari', 'Node.js']
  el.support = {
    'v1.0': { Chrome: 'yes', Firefox: 'yes', Safari: 'partial', 'Node.js': 'no' },
    'v2.0': { Chrome: 'yes', Firefox: 'yes', Safari: 'yes',     'Node.js': 'partial' },
    'v3.0': { Chrome: 'yes', Firefox: 'yes', Safari: 'yes',     'Node.js': 'yes' },
  }
</script>

<!-- Rich title via named slot -->
<tc-compatibility-matrix>
  <span slot="title"><strong>Platform</strong> Support</span>
</tc-compatibility-matrix>
```

---