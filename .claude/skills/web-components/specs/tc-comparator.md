---
component: tc-comparator
---

### tc-comparator

Side-by-side comparison table for two technologies with auto winner detection per row and optional summary stats. Purely presentational — no interactive targets, no events.

**Tag:** `tc-comparator`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Optional heading rendered above the comparison table. |
| `description` | `string` | — | Optional sub-text rendered below the title. |
| `show-summary` | `string` | `""` (true) | Set to `"false"` to hide the summary stats row. Default is to show it. |
| `loading` | boolean | absent | When present, renders skeleton placeholder rows instead of content. |
| `loading-count` | `number` | `5` | Number of skeleton rows to render while loading. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string \| null` | Reflects the `title` attribute. |
| `description` | `string \| null` | Reflects the `description` attribute. |
| `showSummary` | `boolean` | Set to `false` to hide summary. Default `true`. Setting re-renders. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | Reflects the `loading-count` attribute. Default `5`. |
| `left` | `ComparatorTechnology \| null` | Left technology descriptor. Setting re-renders the component. |
| `right` | `ComparatorTechnology \| null` | Right technology descriptor. Setting re-renders the component. |
| `features` | `ComparatorFeature[]` | Array of feature rows. Setting re-renders. Default `[]`. |

**`ComparatorTechnology` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Technology display name (Inter font). |
| `icon` | `string` | no | Lucide icon name (kebab-case, e.g. `"layers"`, `"database"`). |
| `label` | `string` | no | Secondary mono micro-label (e.g. version, author). |

**`ComparatorFeature` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Feature name shown in the centre column. |
| `left` | `boolean \| string \| number` | yes | Left-side value. `true` → check icon, `false` → × icon, string/number → literal text. |
| `right` | `boolean \| string \| number` | yes | Right-side value. Same rendering rules as `left`. |
| `description` | `string` | no | Optional sub-text below the feature label. |

**Winner detection:** booleans — `true` beats `false`; numbers — higher wins; strings that parse as numbers — higher wins; everything else — no winner marked.

**Events**

None. `tc-comparator` is purely presentational.

**Slots**

None. All content is supplied via attributes and JS properties.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-comparator-border` | `1px solid var(--tc-border)` | Outer frame and major dividers. |
| `--bs-comparator-inner-border` | `1px solid var(--tc-slate-100)` | Between-row hairlines. |
| `--bs-comparator-bg` | `var(--tc-surface)` | Table background. |
| `--bs-comparator-header-bg` | `var(--tc-surface-muted)` | Optional header region background. |
| `--bs-comparator-title-font-size` | `1rem` | Title font size. |
| `--bs-comparator-title-font-weight` | `600` | Title font weight. |
| `--bs-comparator-tech-head-bg` | `var(--tc-surface-muted)` | Technology header row background. |
| `--bs-comparator-tech-name-font-size` | `0.9375rem` | Technology name font size. |
| `--bs-comparator-tech-name-font-weight` | `600` | Technology name font weight. |
| `--bs-comparator-tech-label-font-size` | `0.6875rem` | Technology sub-label font size (mono). |
| `--bs-comparator-tech-icon-size` | `1.125rem` | Technology icon size. |
| `--bs-comparator-tech-icon-color` | `var(--tc-text-muted)` | Technology icon color. |
| `--bs-comparator-feature-label-font-size` | `0.875rem` | Feature label font size. |
| `--bs-comparator-feature-desc-font-size` | `0.75rem` | Feature description font size. |
| `--bs-comparator-feature-desc-color` | `var(--tc-text-muted)` | Feature description text color. |
| `--bs-comparator-indicator-size` | `1rem` | Check/× icon size. |
| `--bs-comparator-yes-color` | `var(--tc-success)` | Check indicator color. |
| `--bs-comparator-no-color` | `var(--tc-text-faint)` | × indicator color. |
| `--bs-comparator-winner-bg` | `var(--tc-surface-muted)` | Winner-cell highlight background. |
| `--bs-comparator-summary-bg` | `var(--tc-surface-muted)` | Summary row background. |
| `--bs-comparator-tally-font-size` | `0.6875rem` | Tally count font size (mono). |
| `--bs-comparator-tally-color` | `var(--tc-text-muted)` | Tally count text color. |

```html
<!-- Basic boolean comparison -->
<tc-comparator id="cmp" title="React vs Vue"></tc-comparator>
<script>
  const el = document.getElementById('cmp')
  el.left = { name: 'React', icon: 'layers', label: 'Meta' }
  el.right = { name: 'Vue', icon: 'triangle', label: 'Evan You' }
  el.features = [
    { label: 'TypeScript support', left: true, right: true },
    { label: 'Server components', left: true, right: false },
    { label: 'Built-in state', left: false, right: true },
  ]
</script>

<!-- Numeric values (higher wins) -->
<tc-comparator id="cmp2" title="Runtime comparison"></tc-comparator>
<script>
  const el2 = document.getElementById('cmp2')
  el2.left = { name: 'Node.js', icon: 'server' }
  el2.right = { name: 'Deno', icon: 'shield' }
  el2.features = [
    { label: 'Stars', left: 105000, right: 93000 },
    { label: 'Cold start (ms)', left: 50, right: 30 },
    { label: 'TypeScript native', left: false, right: true },
  ]
</script>

<!-- Hide summary row -->
<tc-comparator show-summary="false" id="cmp3"></tc-comparator>

<!-- Loading state -->
<tc-comparator loading loading-count="6"></tc-comparator>

<!-- With title and description -->
<tc-comparator
  title="PostgreSQL vs SQLite"
  description="Choose the right database for your use case."
  id="cmp4"
></tc-comparator>
```

---