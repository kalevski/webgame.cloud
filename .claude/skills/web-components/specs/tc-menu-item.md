---
component: tc-menu-item
---

### tc-menu-item

Single interactive menu row — icon, label, optional hotkey badge, selected/disabled states. Styled to the toolcase design system: slate neutrals, sharp corners, 1px hairline border, ink accent for the selected state, JetBrains Mono for the hotkey badge. Fires `tc-select` on click or Enter/Space. No shadow root; light DOM; `display: block` (overridden to `display: flex` in the component partial).

**Tag:** `tc-menu-item`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | `''` | Display label for the menu row. XSS-escaped before rendering. |
| `icon` | string | `''` | Lucide icon name in kebab-case (e.g. `"play"`, `"settings"`, `"log-out"`). Rendered as inline SVG. Absent or unrecognised names suppress the icon region. |
| `hotkey` | string | `''` | Keyboard shortcut text shown trailing the label in a monospace badge (e.g. `"Ctrl+S"`, `"Esc"`). Absent means no badge. |
| `selected` | boolean | absent | Marks the row as the active item. Adds `.tc-menu-item--selected`, applies the ink accent fill, and sets `aria-current="true"`. |
| `disabled` | boolean | absent | Disables interaction. Adds `.tc-menu-item--disabled`, sets `aria-disabled="true"`, removes `tabindex`. `tc-select` is suppressed. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Reflects the `label` attribute. |
| `icon` | `string` | `''` | Reflects the `icon` attribute. |
| `hotkey` | `string` | `''` | Reflects the `hotkey` attribute. |
| `selected` | `boolean` | `false` | Reflects the `selected` boolean attribute. |
| `disabled` | `boolean` | `false` | Reflects the `disabled` boolean attribute. |
| `onSelect` | `((label: string) => void) \| null` | `null` | Optional callback fired alongside `tc-select`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ label: string }` | Fired when the user clicks an enabled item or presses Enter/Space while it is focused. Bubbles and is composed. Suppressed when `disabled`. |

**Slots**

`tc-menu-item` has no slots. All content (icon, label, hotkey) is driven by attributes.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-menu-item-bg` | `transparent` | Row background at rest. |
| `--bs-menu-item-color` | `var(--tc-text)` | Text colour at rest. |
| `--bs-menu-item-padding-y` | `0.5rem` | Vertical padding. |
| `--bs-menu-item-padding-x` | `0.875rem` | Horizontal padding. |
| `--bs-menu-item-gap` | `0.5rem` | Gap between icon, label, and hotkey. |
| `--bs-menu-item-min-height` | `2.75rem` | Minimum row height (44 px under coarse pointer). |
| `--bs-menu-item-border-color` | `var(--tc-border)` | Bottom hairline border colour (last child has none). |
| `--bs-menu-item-icon-size` | `1rem` | Width and height of the icon region. |
| `--bs-menu-item-icon-color` | `var(--tc-text-muted)` | Icon colour at rest. |
| `--bs-menu-item-hover-bg` | `var(--tc-surface-muted)` | Background on hover (unselected, enabled). |
| `--bs-menu-item-hover-color` | `var(--tc-text)` | Text colour on hover. |
| `--bs-menu-item-selected-bg` | `var(--tc-app-accent)` | Background when `selected`. |
| `--bs-menu-item-selected-color` | `#fff` | Text colour when `selected`. |
| `--bs-menu-item-selected-icon-color` | `rgba(255,255,255,0.8)` | Icon colour when `selected`. |
| `--bs-menu-item-disabled-opacity` | `0.45` | Opacity when `disabled`. |
| `--bs-menu-item-hotkey-font-family` | `var(--tc-font-mono, 'JetBrains Mono', monospace)` | Hotkey badge font family. |
| `--bs-menu-item-hotkey-font-size` | `0.6875rem` | Hotkey badge font size. |
| `--bs-menu-item-hotkey-color` | `var(--tc-text-muted)` | Hotkey badge text colour at rest. |
| `--bs-menu-item-hotkey-bg` | `var(--tc-surface-muted)` | Hotkey badge background at rest. |
| `--bs-menu-item-hotkey-border` | `1px solid var(--tc-border)` | Hotkey badge border at rest. |
| `--bs-menu-item-hotkey-selected-color` | `rgba(255,255,255,0.85)` | Hotkey badge text when item is `selected`. |
| `--bs-menu-item-hotkey-selected-bg` | `rgba(255,255,255,0.12)` | Hotkey badge background when item is `selected`. |
| `--bs-menu-item-hotkey-selected-border` | `1px solid rgba(255,255,255,0.2)` | Hotkey badge border when item is `selected`. |

**Example**

```html
<!-- Basic item list (wrap in any container) -->
<div style="border: 1px solid var(--tc-border); max-width: 280px;">
  <tc-menu-item label="New File"  icon="file-plus"  hotkey="Ctrl+N"></tc-menu-item>
  <tc-menu-item label="Open"      icon="folder-open" hotkey="Ctrl+O"></tc-menu-item>
  <tc-menu-item label="Save"      icon="save"        hotkey="Ctrl+S" selected></tc-menu-item>
  <tc-menu-item label="Exit"      icon="log-out"     hotkey="Ctrl+Q" disabled></tc-menu-item>
</div>

<script>
    // Listen for selections on the container (events bubble)
    document.querySelector('div').addEventListener('tc-select', e => {
        console.log('selected:', e.detail.label)
    })

    // Or use the onSelect callback on a specific item
    const item = document.querySelector('tc-menu-item')
    item.onSelect = label => console.log('selected:', label)
</script>
```

---