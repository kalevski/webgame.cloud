---
component: tc-file
---

### tc-file

Full-featured file entry row with an inline-editable name, format badge, human-formatted byte size, nested item count, tag chips, and an action menu. Sharp corners (`border-radius: 0`); slate neutrals throughout. All content is driven by attributes and JS properties — no slots.

**Tag:** `tc-file`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Base filename (editable inline when not `readonly`) |
| `extension` | string | — | File extension with optional leading dot, e.g. `".pdf"` or `"pdf"`. Displayed as a mono label beside the name |
| `format` | string | — | Format label for the badge chip, e.g. `"PDF"`. Rendered uppercase in monospace |
| `size` | number (string attr) | `0` | File size in bytes — rendered human-friendly (e.g. `1.2 MB`). `0` hides the size |
| `items` | number (string attr) | `0` | Nested item count. `0` hides the items label |
| `readonly` | boolean | `false` | Disables name editing and hides the action menu |
| `loading` | boolean | `false` | Shows animated skeleton placeholder rows instead of content |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tags` | `FileTag[]` | `[]` | Tag definitions — each `{ id: string, label: string, color?: string }`. Used to resolve `tagIds` to visible chips |
| `tagIds` | `string[]` | `[]` | IDs of the tags to render as chips (resolved against `tags`) |
| `menuItems` | `ActionItem[]` | `[]` | Action menu items — each `{ key: string, label: string, icon?: string, disabled?: boolean }`. Empty array hides the menu button |
| `onNameChange` | `(name: string) => void \| null` | `null` | Callback invoked alongside `tc-name-change` when the user commits a rename |
| `onTagsChange` | `(tagIds: string[]) => void \| null` | `null` | Callback invoked alongside `tc-tags-change` |
| `onMenuItemClick` | `(key: string) => void \| null` | `null` | Callback invoked alongside `tc-menu-item-click` when a menu item is activated |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-name-change` | `{ name: string }` | Fired (bubbles, composed) when the user commits a filename edit via Enter or blur. Escape cancels without firing |
| `tc-tags-change` | `{ tagIds: string[] }` | Fired (bubbles, composed) when the selected tag set changes |
| `tc-menu-item-click` | `{ key: string }` | Fired (bubbles, composed) when a menu item is clicked or activated via keyboard |

**Slots**

None. All content is driven by attributes and JS properties.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-file-bg` | `var(--tc-surface)` | Row background |
| `--bs-file-border-color` | `var(--tc-border)` | 1px row hairline |
| `--bs-file-padding-x` | `0.875rem` | Horizontal row padding |
| `--bs-file-padding-y` | `0.625rem` | Vertical row padding |
| `--bs-file-gap` | `0.5rem` | Gap between row children |
| `--bs-file-hover-bg` | `var(--tc-surface-hover)` | Row hover fill |
| `--bs-file-icon-size` | `1rem` | Leading file icon size |
| `--bs-file-icon-color` | `var(--tc-text-muted)` | Leading file icon color |
| `--bs-file-format-bg` | `var(--tc-surface-muted)` | Format badge fill |
| `--bs-file-format-color` | `var(--tc-text)` | Format badge text color |
| `--bs-file-format-border-color` | `var(--tc-border)` | Format badge hairline |
| `--bs-file-format-font-size` | `0.6rem` | Format badge font size |
| `--bs-file-name-color` | `var(--tc-text)` | Filename text color |
| `--bs-file-name-font-size` | `0.875rem` | Filename font size |
| `--bs-file-ext-color` | `var(--tc-text-muted)` | Extension label color |
| `--bs-file-ext-font-size` | `0.75rem` | Extension label font size |
| `--bs-file-meta-color` | `var(--tc-text-muted)` | Size/items meta text color |
| `--bs-file-meta-font-size` | `0.75rem` | Size/items meta font size |
| `--bs-file-chip-bg` | `var(--tc-surface-muted)` | Tag chip background |
| `--bs-file-chip-color` | `var(--tc-text-muted)` | Tag chip text/border color (overridden per-chip via `--tc-file-chip-color`) |
| `--bs-file-menu-size` | `2rem` | Menu trigger button square size |
| `--bs-file-menu-color` | `var(--tc-text-muted)` | Menu icon color |
| `--bs-file-menu-hover-bg` | `var(--tc-surface-muted)` | Menu trigger hover fill |
| `--bs-file-dropdown-shadow` | `var(--tc-shadow-lg)` | Dropdown overlay shadow |

```html
<!-- Editable file with format badge, size, and tags -->
<tc-file name="Q3-Report" extension=".pdf" format="PDF" size="2621440" items="12"></tc-file>
<script>
  const el = document.querySelector('tc-file')
  el.tags = [
    { id: 'design', label: 'Design', color: '#0ea5e9' },
    { id: 'review', label: 'Review', color: '#f59e0b' },
  ]
  el.tagIds = ['design', 'review']
  el.menuItems = [
    { key: 'rename', label: 'Rename', icon: 'Pencil' },
    { key: 'delete', label: 'Delete', icon: 'Trash2' },
  ]
  el.addEventListener('tc-name-change', e => console.log('rename:', e.detail.name))
  el.addEventListener('tc-menu-item-click', e => console.log('menu:', e.detail.key))
</script>

<!-- Readonly variant -->
<tc-file readonly name="hero-image" extension=".png" format="PNG" size="5242880"></tc-file>

<!-- Loading skeleton -->
<tc-file loading></tc-file>
```

---