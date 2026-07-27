---
component: tc-main-menu
---

### tc-main-menu

Main-menu container of menu items. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing labels, ink accent for the selected item. Items are set via the JS `items` property. Arrow keys navigate between enabled items; Enter/Space fires `tc-select` for the highlighted item; hovering an item also highlights it. No shadow root; light DOM; `display: block`.

**Tag:** `tc-main-menu`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | `''` | ID of the currently selected/highlighted item. Reflected by the `selectedId` JS property. |
| `menu-title` | string | `''` | Optional title shown in the header. When present, an eyebrow micro-label "Main Menu" is also rendered above it. Omit to suppress the header entirely. |
| `subtitle` | string | `''` | Optional subtitle rendered below the title in the header. Ignored when `menu-title` is absent. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selectedId` | `string` | `''` | Reflects the `selected-id` attribute. Setting this re-renders the item list to apply the `--selected` modifier. |
| `menuTitle` | `string` | `''` | Reflects the `menu-title` attribute. |
| `subtitle` | `string` | `''` | Reflects the `subtitle` attribute. |
| `items` | `MainMenuItem[]` | `[]` | Array of menu item objects. Setting this triggers a full re-render. |
| `onSelect` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside `tc-select`. |

**`MainMenuItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique item identifier. Stamped as `data-id` on the row element. |
| `label` | `string` | yes | Display label rendered in the item row. |
| `disabled` | `boolean` | no | When `true` the item gains `--disabled`, `aria-disabled="true"`, and ignores hover, click, and keyboard selection. |
| `badge` | `string` | no | Optional short badge rendered trailing the label (e.g. `"3"`, `"NEW"`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string }` | Fired when the user clicks an enabled item or presses Enter/Space while it is highlighted. Bubbles and is composed. |

**Slots**

`tc-main-menu` has no named slots. All content is driven by attributes and the `items` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-main-menu-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-main-menu-border` | `var(--tc-border)` | Outer 1px hairline border. |
| `--bs-main-menu-header-bg` | `var(--tc-surface-muted)` | Header section background. |
| `--bs-main-menu-header-border` | `var(--tc-border)` | Header bottom border. |
| `--bs-main-menu-eyebrow-color` | `var(--tc-text-muted)` | "Main Menu" eyebrow micro-label colour. |
| `--bs-main-menu-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-main-menu-subtitle-color` | `var(--tc-text-muted)` | Subtitle text colour. |
| `--bs-main-menu-item-color` | `var(--tc-text)` | Default item text colour. |
| `--bs-main-menu-item-border` | `var(--tc-border)` | Divider between items. |
| `--bs-main-menu-item-hover-bg` | `var(--tc-surface-hover, var(--tc-surface-muted))` | Hover / hover-highlight background (unselected enabled items). |
| `--bs-main-menu-item-selected-bg` | `var(--tc-app-accent)` | Selected item fill (ink). |
| `--bs-main-menu-item-selected-color` | `#fff` | Selected item text colour. |
| `--bs-main-menu-item-disabled-color` | `var(--tc-text-faint)` | Disabled item text colour. |
| `--bs-main-menu-item-disabled-opacity` | `0.5` | Opacity for disabled items. |
| `--bs-main-menu-badge-bg` | `var(--tc-surface-muted)` | Badge background (unselected). |
| `--bs-main-menu-badge-color` | `var(--tc-text-muted)` | Badge text colour (unselected). |
| `--bs-main-menu-badge-selected-bg` | `rgba(255,255,255,0.2)` | Badge background when item is selected. |
| `--bs-main-menu-badge-selected-color` | `#fff` | Badge text colour when item is selected. |
| `--bs-main-menu-item-min-height` | `2.75rem` | Item minimum height (44 px under coarse pointer). |

**Example**

```html
<tc-main-menu
    id="my-menu"
    menu-title="Arcane Realms"
    subtitle="Version 2.4.1"
    selected-id="play"
></tc-main-menu>

<script>
    const menu = document.getElementById('my-menu')

    menu.items = [
        { id: 'play',      label: 'Play' },
        { id: 'settings',  label: 'Settings' },
        { id: 'credits',   label: 'Credits' },
        { id: 'quit',      label: 'Quit' },
    ]

    menu.addEventListener('tc-select', e => {
        console.log('selected:', e.detail.id)
    })
</script>
```

---