---
component: tc-group
---

### tc-group

Collapsible group container with a header label, optional badge, and optional action button. The body region holds arbitrary slotted children and is toggled hidden/visible by clicking the header. Dispatches `tc-toggle` on expand/collapse and `tc-action-click` when the action button is activated. The action does not toggle the group.

**Tag:** `tc-group`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | `""` | Header label text. |
| `badge` | string | — | Optional badge shown in the header (count or short label). |
| `default-collapsed` | boolean | false | When present, the group starts in the collapsed state. Only seeds the initial state; does not re-collapse on attribute changes. |
| `action-label` | string | — | Accessible label for the action button; also rendered as visible text when present. |
| `action-icon` | string | — | Lucide icon name in PascalCase (e.g. `"Plus"`, `"Settings"`) rendered inside the action button. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `collapsed` | boolean | `false` | Gets or sets the current collapsed state. Setting it patches the DOM in place and dispatches `tc-toggle`. |
| `onActionClick` | `(() => void) \| null` | `null` | Optional callback fired when the action button is clicked (same timing as `tc-action-click`). |
| `onToggle` | `((collapsed: boolean) => void) \| null` | `null` | Optional callback fired when the group is toggled (same timing as `tc-toggle`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-toggle` | `{ collapsed: boolean }` | Fired (bubbles, composed) when the group expands or collapses. Also calls `onToggle` if set. |
| `tc-action-click` | `{}` | Fired (bubbles, composed) when the action button is clicked. Does not toggle the group. Also calls `onActionClick` if set. |

**Slots**

| Slot | Description |
|------|-------------|
| (default) | Body content. Any children of `<tc-group>` are preserved across re-renders and placed inside the collapsible body region (`.tc-group-body`). |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-group-bg` | `var(--tc-surface)` | Outer container background. |
| `--bs-group-border-color` | `var(--tc-border)` | Border and hairline colors. |
| `--bs-group-header-bg` | `var(--tc-surface)` | Header background at rest. |
| `--bs-group-header-hover-bg` | `var(--tc-surface-muted)` | Header background on hover. |
| `--bs-group-header-color` | `var(--tc-text)` | Header text color. |
| `--bs-group-body-bg` | `var(--tc-surface)` | Body region background. |
| `--bs-group-badge-bg` | `var(--tc-surface-muted)` | Badge chip background. |
| `--bs-group-badge-color` | `var(--tc-text)` | Badge chip text color. |
| `--bs-group-action-color` | `var(--tc-text-muted)` | Action button icon color at rest. |
| `--bs-group-action-hover-bg` | `var(--tc-surface-muted)` | Action button background on hover. |

```html
<!-- Basic -->
<tc-group label="Settings">
  <p>Body content here.</p>
</tc-group>

<!-- With badge -->
<tc-group label="Active Users" badge="42">
  <p>42 users online.</p>
</tc-group>

<!-- Default collapsed -->
<tc-group label="Advanced Options" default-collapsed>
  <p>Hidden by default.</p>
</tc-group>

<!-- With action button -->
<tc-group id="docs" label="Documents" badge="7" action-label="Add" action-icon="Plus">
  <p>List of documents.</p>
</tc-group>
<script>
  const g = document.getElementById('docs')
  g.onActionClick = () => console.log('add document')
  g.onToggle = collapsed => console.log('toggled, collapsed:', collapsed)
  g.addEventListener('tc-action-click', e => console.log('tc-action-click', e.detail))
  g.addEventListener('tc-toggle', e => console.log('tc-toggle', e.detail))
</script>

<!-- Programmatic control -->
<tc-group id="prog" label="Collapsible">
  <p>Controlled from JS.</p>
</tc-group>
<script>
  const el = document.getElementById('prog')
  el.collapsed = true  // collapse immediately
</script>

---