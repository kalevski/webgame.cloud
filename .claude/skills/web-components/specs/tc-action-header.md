---
component: tc-action-header
---

### tc-action-header

Flex header row with slotted title content on the left and a row of action buttons on the right. Dispatches a `tc-exec` custom event when an action button is clicked.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `disabled` | boolean | false | Disables all action buttons and suppresses `tc-exec` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `actions` | `ActionHeaderAction[]` | `[]` | Array of action descriptors (see below) |
| `onExec` | `(key: string) => void \| null` | `null` | Optional callback invoked in addition to the `tc-exec` event |

**ActionHeaderAction shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | yes | Unique identifier, returned in `tc-exec` detail |
| `label` | `string` | no | Button label text |
| `icon` | `string` | no | Lucide icon name in PascalCase (e.g. `"Pencil"`, `"Trash2"`) |
| `variant` | `string` | no | Bootstrap button variant — default `"secondary"` |
| `disabled` | `boolean` | no | Disables this individual action |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-exec` | `{ key: string }` | Fired (bubbles) when a non-disabled action button is clicked |

**Slots**

The element's light-DOM children are placed in the left content region (`.tc-action-header-content`). Use headings, text, or badges here.

```html
<tc-action-header id="hdr">
    <strong>Users</strong>
</tc-action-header>

<script>
    const el = document.getElementById('hdr')
    el.actions = [
        { key: 'add',    label: 'Add',    icon: 'Plus' },
        { key: 'export', label: 'Export', icon: 'Download' },
        { key: 'delete', label: 'Delete', variant: 'danger' },
    ]
    el.addEventListener('tc-exec', e => console.log('exec', e.detail.key))
</script>
```

---