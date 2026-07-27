---
component: tc-list
---

### tc-list

Generic vertical selectable list with icon, label, and optional meta cells. Styled to the toolcase design system. Items are supplied exclusively via the `items` JS property; the host carries `role="listbox"` and each row carries `role="option"`. Emits `tc-select` when a non-disabled row is activated via click, Enter, or Space. Sharp corners; slate neutrals; ink accent marks the selected row. Supports lucide icon names (rendered as SVG) and emoji/text icons.

**Tag:** `tc-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | `''` | ID of the currently selected item. Setting this attribute triggers a re-render. Reflected by the `selectedId` JS property. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `ListItem[]` | `[]` | Array of list item descriptors. Setting this property re-renders the list. |
| `selectedId` | `string` | `''` | Reflected accessor for the `selected-id` attribute. |
| `onSelect` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-select` CustomEvent. |

**ListItem shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Stable unique identifier. Written to `data-id` on the row element. |
| `label` | `string` | no | Primary label text. |
| `icon` | `string` | no | Lucide icon name (kebab-case, e.g. `"inbox"`) rendered as inline SVG, or any emoji/text string displayed as plain text. |
| `meta` | `string` | no | Secondary trailing text (e.g. a count or value) rendered in JetBrains Mono. |
| `disabled` | `boolean` | no | When `true`, the row is visually muted and not interactive. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string }` | Fired when a non-disabled item is selected by click, Enter, or Space. `id` is the selected item's `id` field. |

**Slots**

None. `tc-list` is purely data-driven via the `items` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-list-bg` | `var(--tc-surface)` | List background colour. |
| `--bs-list-border-color` | `var(--tc-border)` | Outer 1px hairline border colour. |
| `--bs-list-row-border-color` | `var(--tc-border)` | 1px hairline separator between rows. |
| `--bs-list-row-padding-y` | `0.625rem` | Vertical padding per row. |
| `--bs-list-row-padding-x` | `0.875rem` | Horizontal padding per row. |
| `--bs-list-row-gap` | `0.625rem` | Gap between icon and body. |
| `--bs-list-min-height` | `2.75rem` | Minimum row height (44px under coarse pointer). |
| `--bs-list-icon-size` | `1.25rem` | Width/height of lucide icon SVG. |
| `--bs-list-icon-text-size` | `1rem` | Font size for emoji/text icons. |
| `--bs-list-icon-color` | `var(--tc-text-muted)` | Default icon colour. |
| `--bs-list-label-color` | `var(--tc-text)` | Label text colour. |
| `--bs-list-label-font-size` | `0.9375rem` | Label font size. |
| `--bs-list-meta-color` | `var(--tc-text-faint)` | Meta text colour. |
| `--bs-list-meta-font-size` | `0.8125rem` | Meta font size. |
| `--bs-list-meta-font-family` | `var(--tc-font-mono)` | Meta font family (JetBrains Mono). |
| `--bs-list-selected-bg` | `var(--tc-surface-muted)` | Row background when selected. |
| `--bs-list-selected-label-color` | `var(--tc-app-accent)` | Label colour when selected. |
| `--bs-list-selected-icon-color` | `var(--tc-app-accent)` | Icon colour when selected. |
| `--bs-list-selected-border-color` | `var(--tc-app-accent)` | 3px left-border accent colour when selected. |
| `--bs-list-disabled-opacity` | `0.45` | Opacity applied to disabled rows. |
| `--bs-list-focus-outline` | `2px solid var(--tc-app-accent)` | Focus-visible outline on rows. |

**Example**

```html
<tc-list id="my-list" selected-id="inbox"></tc-list>

<script>
    const list = document.getElementById('my-list')

    list.items = [
        { id: 'inbox',   label: 'Inbox',   icon: 'inbox',   meta: '12' },
        { id: 'sent',    label: 'Sent',    icon: 'send',    meta: '4'  },
        { id: 'drafts',  label: 'Drafts',  icon: 'file-text' },
        { id: 'archive', label: 'Archive', icon: 'archive', disabled: true },
    ]

    list.addEventListener('tc-select', e => {
        console.log('selected', e.detail.id)
    })
</script>
```

---