---
component: tc-migration-guide
---

### tc-migration-guide

Step-by-step migration guide with a version transition header (from → to version labels) and numbered steps, each with an optional description and before/after code diff panels. Purely presentational — no interactive targets, no events.

**Tag:** `tc-migration-guide`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `from` | `string` | `""` | Source version label (machine-facing, rendered mono). |
| `to` | `string` | `""` | Target version label (machine-facing, rendered mono). |
| `title` | `string` | `"Migrating from {from} to {to}"` | Optional heading for the guide. Defaults to an auto-generated label from `from` and `to` when absent. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `from` | `string` | Reflects the `from` attribute. |
| `to` | `string` | Reflects the `to` attribute. |
| `title` | `string \| null` | Reflects the `title` attribute. Setting `null` removes the attribute (restores the default). |
| `steps` | `MigrationStep[]` | Array of step objects. Setting re-renders the guide. Default `[]`. |

**`MigrationStep` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | yes | Step heading. |
| `description` | `string` | no | Explanatory prose below the heading, rendered in `--tc-text-muted`. |
| `before` | `string` | no | Code string shown in the "before" diff panel (danger-tinted, 3 px red left stripe). HTML is escaped. |
| `after` | `string` | no | Code string shown in the "after" diff panel (success-tinted, 3 px green left stripe). HTML is escaped. |
| `language` | `string` | no | Language hint (informational only — not rendered; syntax highlighting is not applied). |

**Events**

None. `tc-migration-guide` is purely presentational.

**Slots**

None. All content is supplied via attributes and the `steps` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-migration-guide-border` | `1px solid var(--tc-border)` | Outer and internal hairlines. |
| `--bs-migration-guide-bg` | `var(--tc-surface)` | Guide wrapper background. |
| `--bs-migration-guide-header-bg` | `var(--tc-surface-muted)` | Header region background. |
| `--bs-migration-guide-header-color` | `var(--tc-text)` | Title and step-title text color. |
| `--bs-migration-guide-title-font-size` | `0.9375rem` | Guide title font size. |
| `--bs-migration-guide-title-font-weight` | `600` | Guide title font weight. |
| `--bs-migration-guide-version-font-size` | `0.6875rem` | Version label font size. |
| `--bs-migration-guide-version-color` | `var(--tc-text-muted)` | Version label text color. |
| `--bs-migration-guide-arrow-size` | `0.9rem` | Arrow icon size. |
| `--bs-migration-guide-arrow-color` | `var(--tc-text-faint)` | Arrow icon color. |
| `--bs-migration-guide-step-num-font-size` | `0.6875rem` | Step number font size. |
| `--bs-migration-guide-step-num-color` | `var(--tc-text-faint)` | Step number color. |
| `--bs-migration-guide-step-desc-color` | `var(--tc-text-muted)` | Step description text color. |
| `--bs-migration-guide-code-bg` | `var(--tc-ink)` | Code panel background (dark surface). |
| `--bs-migration-guide-code-color` | `var(--tc-text-inverse)` | Code text color (white on dark). |
| `--bs-migration-guide-code-font-size` | `0.8125rem` | Code font size. |
| `--bs-migration-guide-diff-stripe-width` | `3px` | Width of the colored left stripe on diff panels. |
| `--bs-migration-guide-diff-before-stripe` | `var(--tc-danger)` | Before-panel left stripe color. |
| `--bs-migration-guide-diff-before-bg` | `var(--tc-danger-bg)` | Before-panel soft tint background. |
| `--bs-migration-guide-diff-after-stripe` | `var(--tc-success)` | After-panel left stripe color. |
| `--bs-migration-guide-diff-after-bg` | `var(--tc-success-bg)` | After-panel soft tint background. |

```html
<!-- Minimal — header only, no steps -->
<tc-migration-guide from="v1" to="v2"></tc-migration-guide>

<!-- Custom title -->
<tc-migration-guide from="v1" to="v2" title="Upgrading to v2"></tc-migration-guide>

<!-- With steps (set via JS) -->
<tc-migration-guide id="guide" from="v1.0" to="v2.0"></tc-migration-guide>
<script>
  document.getElementById('guide').steps = [
    {
      title: 'Update the import path',
      description: 'The package has moved to a scoped name.',
      before: "import { Button } from 'toolcase'",
      after: "import { Button } from '@toolcase/web-components'",
    },
    {
      title: 'Replace className with variant',
      before: '<Button className="btn-primary">Save</Button>',
      after: '<Button variant="primary">Save</Button>',
    },
  ]
</script>
```

---