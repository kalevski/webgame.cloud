---
component: tc-danger-zone-actions
---

### tc-danger-zone-actions

List of destructive actions rendered inside a danger-bordered panel. Each action row shows a title, optional description, and an `btn-outline-danger` button. Driven entirely by the `actions` JS property. Fires `tc-action-click` when a button is clicked.

**Tag:** `tc-danger-zone-actions`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `class-name` | string | — | Additional CSS classes applied to the inner `.tc-danger-zone` wrapper (not the host element). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `actions` | `DangerZoneAction[]` | `[]` | Array of action objects. Each item must have `key`, `title`, `buttonLabel`; optional `description`, `icon` (Lucide PascalCase name), `disabled`. Setting re-renders the list. |
| `onactionclick` | `((key: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-action-click` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-action-click` | `{ key: string }` | Dispatched when an action button is clicked. `bubbles: true`, `composed: true`. Not fired for disabled actions. |

**Slots**

None. `tc-danger-zone-actions` is driven entirely by the `actions` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-danger-zone-actions-border-color` | `var(--tc-danger)` | Border color of the outer danger panel (left + frame). |
| `--bs-danger-zone-actions-bg` | `var(--tc-danger-bg)` | Background tint of the panel. |
| `--bs-danger-zone-actions-separator-color` | `var(--tc-border)` | 1px hairline between action rows. |
| `--bs-danger-zone-actions-title-color` | `var(--tc-text)` | Color of the action title text. |
| `--bs-danger-zone-actions-desc-color` | `var(--tc-text-muted)` | Color of the optional description text. |
| `--bs-danger-zone-actions-padding-x` | `1rem` | Horizontal padding of each action row. |
| `--bs-danger-zone-actions-padding-y` | `0.875rem` | Vertical padding of each action row. |
| `--bs-danger-zone-actions-gap` | `0.75rem` | Gap between the text block and button in a row. |
| `--bs-danger-zone-actions-title-font-size` | `0.925rem` | Font size of the action title. |
| `--bs-danger-zone-actions-desc-font-size` | `0.8125rem` | Font size of the description. |
| `--bs-danger-zone-actions-btn-min-height` | `2rem` | Minimum height of action buttons. |

```html
<!-- Basic usage -->
<tc-danger-zone-actions id="dz"></tc-danger-zone-actions>
<script>
  const el = document.getElementById('dz')
  el.actions = [
    {
      key: 'delete-account',
      title: 'Delete account',
      description: 'Permanently remove your account and all its data.',
      buttonLabel: 'Delete account',
    },
    {
      key: 'reset-data',
      title: 'Reset all data',
      description: 'Wipe all project data. Your billing will remain active.',
      buttonLabel: 'Reset data',
    },
  ]
  el.addEventListener('tc-action-click', e => console.log('clicked:', e.detail.key))
</script>

<!-- With icons and a disabled action -->
<tc-danger-zone-actions id="dz2"></tc-danger-zone-actions>
<script>
  document.getElementById('dz2').actions = [
    { key: 'revoke', title: 'Revoke tokens', buttonLabel: 'Revoke', icon: 'KeyRound' },
    { key: 'delete', title: 'Delete workspace', buttonLabel: 'Delete', icon: 'Trash2', disabled: true },
  ]
</script>