---
component: tc-context-menu
---

### tc-context-menu

Right-click / long-press context menu with nested submenu support and full keyboard navigation (ArrowUp/Down/Left/Right, Enter, Space, Escape). Fires `tc-select` when a leaf item is chosen.

**Tag:** `tc-context-menu`

**Attributes**

None. All state is driven by JS properties and pointer/keyboard interaction.

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `ContextMenuItem[]` | `[]` | Menu item definitions. Setting re-renders. See `ContextMenuItem` below. |
| `onSelect` | `((key: string) => void) \| null` | `null` | Callback fired alongside `tc-select` when a leaf item is chosen. |

**`ContextMenuItem` shape**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier dispatched with `tc-select`. |
| `label` | `string` | Display text. |
| `icon?` | `string` | Lucide icon name in PascalCase (e.g. `"Trash2"`). |
| `disabled?` | `boolean` | Disables the item (opacity + pointer-events). |
| `separator?` | `boolean` | Renders a 1 px hairline divider (ignores other fields). |
| `danger?` | `boolean` | Colors the item with `--tc-danger`. |
| `children?` | `ContextMenuItem[]` | Nested submenu items (opens on hover / ArrowRight). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ key: string }` | Fired when a non-disabled, non-separator leaf item is chosen. Bubbles + composed. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | The trigger content. Right-click (or long-press on touch) this content to open the menu. |

**Keyboard navigation**

| Key | Action |
|-----|--------|
| `ArrowDown` / `ArrowUp` | Move focus among items (wraps, skips separators/disabled). |
| `ArrowRight` | Open submenu and focus its first item. |
| `ArrowLeft` | Close submenu and return focus to parent item. |
| `Enter` / `Space` | Select leaf item (dispatch `tc-select` + close) or open submenu. |
| `Escape` | Close innermost open submenu; if at root, close the whole menu. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-context-menu-min-width` | `180px` | Minimum menu width. |
| `--bs-context-menu-padding-y` | `0.25rem` | Vertical padding of the menu surface. |
| `--bs-context-menu-bg` | `var(--tc-surface)` | Menu background. |
| `--bs-context-menu-border` | `1px solid var(--tc-border)` | Menu border. |
| `--bs-context-menu-shadow` | `var(--tc-shadow-lg)` | Drop shadow (overlay tier). |
| `--bs-context-menu-z-index` | `var(--tc-z-dropdown)` | Stacking order. |
| `--bs-context-menu-item-padding-x` | `0.625rem` | Horizontal item padding. |
| `--bs-context-menu-item-padding-y` | `0.4375rem` | Vertical item padding. |
| `--bs-context-menu-item-font-size` | `0.8125rem` | Item label font size (13 px). |
| `--bs-context-menu-item-color` | `var(--tc-slate-700)` | Default item text color. |
| `--bs-context-menu-item-hover-bg` | `var(--tc-surface-muted)` | Item hover / open-parent background. |
| `--bs-context-menu-item-hover-color` | `var(--tc-text)` | Item hover text color. |
| `--bs-context-menu-item-disabled-opacity` | `0.45` | Disabled item opacity. |
| `--bs-context-menu-separator-color` | `var(--tc-border)` | Separator hairline color. |
| `--bs-context-menu-danger-color` | `var(--tc-danger)` | Danger item text color. |
| `--bs-context-menu-danger-hover-bg` | `var(--tc-surface-muted)` | Danger item hover background. |

```html
<!-- Basic right-click menu -->
<tc-context-menu id="cm">
  <button type="button" class="btn btn-secondary">Right-click me</button>
</tc-context-menu>
<script>
  const el = document.getElementById('cm')
  el.items = [
    { key: 'copy',   label: 'Copy',   icon: 'Copy' },
    { key: 'cut',    label: 'Cut',    icon: 'Scissors' },
    { key: 'paste',  label: 'Paste',  icon: 'Clipboard', disabled: true },
    { key: 'sep-1',  label: '',       separator: true },
    { key: 'delete', label: 'Delete', icon: 'Trash2', danger: true },
  ]
  el.addEventListener('tc-select', e => console.log('selected', e.detail.key))
</script>

<!-- With nested submenu -->
<tc-context-menu id="cm2">
  <div style="width:200px;height:120px;border:2px dashed #ccc">Right-click</div>
</tc-context-menu>
<script>
  document.getElementById('cm2').items = [
    { key: 'open', label: 'Open', icon: 'FolderOpen' },
    {
      key: 'share', label: 'Share', icon: 'Share2',
      children: [
        { key: 'share-link',  label: 'Copy link',      icon: 'Link' },
        { key: 'share-email', label: 'Send by email',  icon: 'Mail' },
      ],
    },
    { key: 'sep',    label: '', separator: true },
    { key: 'remove', label: 'Remove', icon: 'Trash2', danger: true },
  ]
</script>
```

---