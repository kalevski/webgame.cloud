---
component: tc-feature-matrix
---

### tc-feature-matrix

Comparison table of features vs columns, supporting boolean, partial, and custom string values with optional column highlight bands. Designed for plan or capability comparison.

**Tag:** `tc-feature-matrix`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Text title rendered above the table. When absent, slotted children fill the title region instead |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `MatrixColumn[]` | Column definitions — set via JS property |
| `rows` | `MatrixRow[]` | Row definitions — set via JS property |

`MatrixColumn`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier used as key in `row.values` |
| `label` | string | Column header label |
| `highlight` | boolean? | When `true`, applies a slate band across the column |

`MatrixRow`:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Feature name shown in the first column |
| `hint` | string? | Optional muted sub-text beneath the label |
| `values` | `Record<columnId, MatrixValue>` | Map from column `id` to the cell value |

`MatrixValue` semantics:

| Value | Rendered as |
|-------|-------------|
| `true` (boolean) | Check icon in `--tc-success` with `aria-label="Supported"` |
| `false` (boolean) | X icon in `--tc-text-faint` with `aria-label="Not supported"` |
| `'partial'` (string literal) | Minus icon in `--tc-warning` with `aria-label="Partial"` |
| any other string | Plain text in monospace (`--tc-font-mono`) |

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Title content rendered above the table when the `title` attribute is absent. Preserved across re-renders. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-feature-matrix-border` | `1px solid var(--tc-border)` | Outer frame border |
| `--bs-feature-matrix-inner-border` | `1px solid var(--tc-slate-100)` | Internal row separators |
| `--bs-feature-matrix-bg` | `var(--tc-surface)` | Cell background |
| `--bs-feature-matrix-header-bg` | `var(--tc-surface-muted)` | Title header background |
| `--bs-feature-matrix-head-bg` | `var(--tc-surface-muted)` | Column header row background |
| `--bs-feature-matrix-highlight-bg` | `var(--tc-surface-muted)` | Highlighted column band fill |
| `--bs-feature-matrix-row-hover-bg` | `var(--tc-surface-hover)` | Row hover fill |
| `--bs-feature-matrix-yes-color` | `var(--tc-success)` | Check icon colour |
| `--bs-feature-matrix-no-color` | `var(--tc-text-faint)` | X icon colour |
| `--bs-feature-matrix-partial-color` | `var(--tc-warning)` | Partial icon colour |
| `--bs-feature-matrix-title-color` | `var(--tc-text)` | Title text colour |
| `--bs-feature-matrix-indicator-size` | `1rem` | Icon size |

```html
<!-- Basic usage -->
<tc-feature-matrix id="matrix" title="Plan Comparison"></tc-feature-matrix>
<script>
  const el = document.getElementById('matrix')
  el.columns = [
    { id: 'free', label: 'Free' },
    { id: 'pro', label: 'Pro', highlight: true },
    { id: 'enterprise', label: 'Enterprise', highlight: true },
  ]
  el.rows = [
    { label: 'Custom domains', hint: 'Bring your own', values: { free: false, pro: true, enterprise: true } },
    { label: 'Analytics', values: { free: 'partial', pro: true, enterprise: true } },
    { label: 'SLA uptime', values: { free: '99.5%', pro: '99.9%', enterprise: '99.99%' } },
  ]
</script>

<!-- Slotted title -->
<tc-feature-matrix id="matrix2">
  <span slot="title"><strong>Open Source</strong> vs Cloud</span>
</tc-feature-matrix>
<script>
  const el2 = document.getElementById('matrix2')
  el2.columns = [
    { id: 'oss', label: 'OSS' },
    { id: 'cloud', label: 'Cloud', highlight: true },
  ]
  el2.rows = [
    { label: 'Self-hosted', values: { oss: true, cloud: false } },
    { label: 'Managed updates', values: { oss: false, cloud: true } },
  ]
</script>