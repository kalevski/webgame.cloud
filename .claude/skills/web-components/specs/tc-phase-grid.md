---
component: tc-phase-grid
---

### tc-phase-grid

CSS-grid of phase/timeline cards with status indicators, optional description, tag chips, and a shell-command block. Status is conveyed by icon + text label (not color alone). No events emitted — purely presentational.

**Tag:** `tc-phase-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `number` | `3` | Number of grid columns. Any positive integer; falls back to `3` on invalid/absent values. Collapses to fewer columns on narrow viewports. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `number` | Reflects the `columns` attribute as a number. |
| `phases` | `PhaseItem[]` | Array of phase data objects. Setting re-renders the entire grid. Default `[]`. |

**`PhaseItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | yes | Phase title — rendered as Inter semibold. |
| `status` | `'complete' \| 'active' \| 'upcoming' \| 'blocked'` | yes | Phase status. Drives the status icon, left stripe color, and label. |
| `description` | `string` | no | Optional muted description paragraph below the title. |
| `tags` | `string[]` | no | Optional mono micro-label chips. Rendered in a flex-wrap row. |
| `command` | `string` | no | Optional shell/CLI command rendered as a mono `<code>` block on an ink background. |

**Events**

None. `tc-phase-grid` is purely presentational.

**Slots**

None. All content is supplied via the `phases` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-phase-grid-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-phase-grid-card-border` | `var(--tc-border)` | Hairline color (1px-gap grid + outer border). |
| `--bs-phase-grid-card-padding` | `1.25rem` | Inner card padding. |
| `--bs-phase-grid-title-color` | `var(--tc-text)` | Title text color. |
| `--bs-phase-grid-title-font-size` | `0.9375rem` | Title font size. |
| `--bs-phase-grid-title-font-weight` | `600` | Title font weight. |
| `--bs-phase-grid-desc-color` | `var(--tc-text-muted)` | Description text color. |
| `--bs-phase-grid-desc-font-size` | `0.8125rem` | Description font size. |
| `--bs-phase-grid-status-label-font-size` | `0.6875rem` | Status indicator label font size. |
| `--bs-phase-grid-status-icon-size` | `0.875rem` | Status icon size. |
| `--bs-phase-grid-complete-color` | `var(--tc-success)` | Color for `complete` status icon and left stripe. |
| `--bs-phase-grid-active-color` | `var(--tc-info)` | Color for `active` status icon and left stripe. |
| `--bs-phase-grid-upcoming-color` | `var(--tc-text-faint)` | Color for `upcoming` status icon and left stripe. |
| `--bs-phase-grid-blocked-color` | `var(--tc-danger)` | Color for `blocked` status icon and left stripe. |
| `--bs-phase-grid-stripe-width` | `3px` | Width of the colored left-border stripe on each card. |
| `--bs-phase-grid-tag-bg` | `var(--tc-surface-muted)` | Tag chip background. |
| `--bs-phase-grid-tag-color` | `var(--tc-text-muted)` | Tag chip text color. |
| `--bs-phase-grid-tag-border` | `var(--tc-border)` | Tag chip border color. |
| `--bs-phase-grid-tag-font-size` | `0.6875rem` | Tag chip font size. |
| `--bs-phase-grid-command-bg` | `var(--tc-ink)` | Command block background (dark ink surface). |
| `--bs-phase-grid-command-color` | `var(--tc-text-inverse)` | Command block text color. |
| `--bs-phase-grid-command-font-size` | `0.75rem` | Command block font size. |
| `--bs-phase-grid-active-spin-duration` | `1.5s` | Rotation period for the active status spinner icon. |
| `--bs-phase-grid-active-spin-duration-reduced` | `3s` | Reduced-motion rotation period (slows rather than stops). |

```html
<!-- Set phases via JS property -->
<tc-phase-grid id="roadmap" columns="3"></tc-phase-grid>
<script>
  document.getElementById('roadmap').phases = [
    {
      title: 'Project Setup',
      description: 'Initialise repo, CI/CD, and base tooling.',
      status: 'complete',
      tags: ['infra', 'ci'],
      command: 'npm create toolcase@latest my-app',
    },
    {
      title: 'Core Features',
      description: 'Implement the primary user-facing features.',
      status: 'active',
      tags: ['feature', 'v1'],
      command: 'npm run dev',
    },
    {
      title: 'Testing & QA',
      description: 'Full coverage for unit, integration, and E2E tests.',
      status: 'upcoming',
      tags: ['testing'],
      command: 'npm test',
    },
  ]
</script>

<!-- 2 columns -->
<tc-phase-grid id="blocked-phases" columns="2"></tc-phase-grid>
<script>
  document.getElementById('blocked-phases').phases = [
    { title: 'Database Migration', status: 'blocked', tags: ['database'] },
    { title: 'Auth Integration', status: 'upcoming', command: 'npx auth setup' },
  ]
</script>

<!-- 4 columns — compact -->
<tc-phase-grid id="compact" columns="4"></tc-phase-grid>
<script>
  document.getElementById('compact').phases = [
    { title: 'Planning', status: 'complete' },
    { title: 'Development', status: 'active' },
    { title: 'Review', status: 'upcoming' },
    { title: 'Deploy', status: 'upcoming' },
  ]
</script>
```

---