---
component: tc-state-machine
---

### tc-state-machine

Vertical state-progression display with per-state status markers. States are set via a JS property (`states`). Markers reflect status: done (check icon), active (filled dot with pulse ring), pending (hollow circle), error (alert icon). Consecutive states are joined by a 1px connector line. Sharp corners everywhere; the only curve is the circular status dot.

**Tag:** `tc-state-machine`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `compact` | boolean | `false` | When present, tightens vertical spacing and hides state descriptions. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `states` | `StateMachineItem[]` | Array of state objects. Set via `el.states = [...]`. |
| `compact` | `boolean` | Reflects the `compact` attribute. |

`StateMachineItem` shape:

```ts
type StateMachineStatus = 'done' | 'active' | 'pending' | 'error'

interface StateMachineItem {
    id: string
    label: string
    description?: string
    status?: StateMachineStatus  // defaults to 'pending'
}
```

**Events**

None. `tc-state-machine` is purely presentational.

**Slots**

None. All content is driven by the `states` JS property.

**Accessibility**

- The host element carries `role="list"`; each state row carries `role="listitem"`.
- Each status marker carries an `aria-label` with the capitalised status name (e.g. `"Done"`, `"Active"`, `"Pending"`, `"Error"`).
- The pulse ring on the active marker respects `prefers-reduced-motion` (animation disabled when reduced motion is preferred).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-state-machine-marker-size` | `1.5rem` | Diameter of the circular status marker. |
| `--bs-state-machine-icon-size` | `0.875rem` | Size of the icon SVG inside the marker. |
| `--bs-state-machine-track-gap` | `0.75rem` | Horizontal gap between the track column and the body column. |
| `--bs-state-machine-connector-color` | `var(--tc-border)` | Color of the 1px vertical connector between states. |
| `--bs-state-machine-connector-min-height` | `0.75rem` | Minimum height of the connector line (reduced to `0.375rem` in compact mode). |
| `--bs-state-machine-label-color` | `var(--tc-text)` | Label text color. |
| `--bs-state-machine-label-font-size` | `0.875rem` | Label font size. |
| `--bs-state-machine-label-font-weight` | `500` | Label font weight. |
| `--bs-state-machine-description-color` | `var(--tc-text-muted)` | Description text color. |
| `--bs-state-machine-description-font-size` | `0.75rem` | Description font size (monospace). |

```html
<tc-state-machine id="pipeline"></tc-state-machine>

<script>
document.querySelector('#pipeline').states = [
    { id: 'provision', label: 'Provision', description: 'Allocate cloud resources', status: 'done' },
    { id: 'build',     label: 'Build',     description: 'Compile and bundle assets', status: 'done' },
    { id: 'deploy',    label: 'Deploy',    description: 'Roll out to cluster',       status: 'active' },
    { id: 'verify',    label: 'Verify',    description: 'Run smoke tests',           status: 'pending' },
    { id: 'notify',    label: 'Notify',    description: 'Send release summary',      status: 'pending' },
]
</script>

<!-- Compact variant -->
<tc-state-machine compact id="pipeline-compact"></tc-state-machine>
<script>
document.querySelector('#pipeline-compact').states = [
    { id: 'checkout', label: 'Checkout',  status: 'done' },
    { id: 'lint',     label: 'Lint',      status: 'error' },
    { id: 'test',     label: 'Test',      status: 'pending' },
]
</script>
```

---