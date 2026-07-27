---
component: tc-action-items
---

### tc-action-items

Dropdown menu button with keyboard-accessible items positioned relative to the trigger. Fires `tc-action-click` when an item is chosen and closes the menu.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | `'Actions'` | Trigger button text |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `ActionItem[]` | `[]` | Array of menu item descriptors (see below) |
| `onActionClick` | `(key: string) => void \| null` | `null` | Optional callback invoked in addition to `tc-action-click` |

**ActionItem shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | yes | Unique identifier returned in `tc-action-click` detail |
| `label` | `string` | yes | Item label text |
| `icon` | `string` | no | Lucide icon name in PascalCase (e.g. `"Pencil"`, `"Trash2"`) |
| `disabled` | `boolean` | no | Disables this item (skipped in keyboard navigation) |
| `danger` | `boolean` | no | Renders the item in danger/destructive color |
| `divider` | `boolean` | no | Renders a horizontal separator instead of a button |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-action-click` | `{ key: string }` | Fired (bubbles) when a non-disabled item is activated |

**Slots:** none

```html
<tc-action-items id="menu" label="Actions"></tc-action-items>

<script>
    const el = document.getElementById('menu')
    el.items = [
        { key: 'edit',   label: 'Edit',   icon: 'Pencil' },
        { key: 'share',  label: 'Share',  icon: 'Share2' },
        { key: 'div',    label: '',       divider: true },
        { key: 'delete', label: 'Delete', icon: 'Trash2', danger: true },
    ]
    el.addEventListener('tc-action-click', e => console.log('chosen', e.detail.key))
</script>
```

---