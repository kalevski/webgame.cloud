---
component: tc-vertical-item-list
---

### tc-vertical-item-list

Vertical navigation menu with icons and badges beside an associated content area. Items are set via the `items` JS property (array of `VerticalItemListItem`). The menu is a vertical underline-nav — the only chrome is a 2px ink marker on the **left edge** of the active item (no boxes or fills). Supports uncontrolled mode (`default-active-key`) and controlled mode (`active-key` — the active item is driven by the attribute and the element only emits on click). The content area beside the menu is the default slot: project per-key content there and swap it in your `tc-select` handler. ARIA vertical-tablist pattern with roving tabindex: Up/Down move focus, Home/End jump to first/last, Enter/Space select. `loading` shows skeleton rows; `disabled` makes the whole control inert. No shadow DOM.

**Tag:** `tc-vertical-item-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active-key` | string | absent | When present the component is **controlled** — the active item is driven by this attribute and does not change on click (the element only emits `tc-select`). |
| `default-active-key` | string | first item | Initial active item when uncontrolled. Ignored once the user selects an item or when `active-key` is present. |
| `disabled` | boolean | absent | Dims the control and blocks all interaction. |
| `loading` | boolean | absent | Replaces the menu items with skeleton placeholder rows. |
| `loading-count` | number | `5` | Number of skeleton rows shown while `loading`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `VerticalItemListItem[]` | `[]` | The menu items. Each item: `{ key: string; icon?: string; text: string; badge?: string \| number }`. `icon` is a lucide icon name; `badge` renders a trailing pill. Set via JS; not reflected as an attribute. |
| `onSelect` | function | `null` | Optional callback fired on selection — receives the selected `key`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ key: string }` | Fired when an item is chosen (click or keyboard). In controlled mode it fires without changing the active item. |

**Slots**

| Slot | Description |
|------|-------------|
| _default_ | Light-DOM children rendered into the associated content area beside the menu. Preserved across re-render — swap them per active key in your `tc-select` handler. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-vertical-item-list-menu-width` | `14rem` | Fixed width of the vertical menu column. |
| `--bs-vertical-item-list-border` | `1px solid var(--tc-border)` | Hairline separating the menu from the content area. |
| `--bs-vertical-item-list-item-color` | `var(--tc-text-muted)` | Inactive item text colour. |
| `--bs-vertical-item-list-item-hover-bg` | `var(--tc-surface-hover)` | Hover slate well behind an item. |
| `--bs-vertical-item-list-marker-color` | `var(--tc-app-accent)` | Colour of the 2px active left-edge marker. |
| `--bs-vertical-item-list-marker-width` | `2px` | Width of the active left-edge marker. |
| `--bs-vertical-item-list-icon-color` | `var(--tc-text-faint)` | Leading icon colour at rest. |
| `--bs-vertical-item-list-badge-bg` | `var(--tc-app-accent)` | Trailing badge background. |
| `--bs-vertical-item-list-content-padding` | `1rem` | Padding inside the content area. |
| `--bs-vertical-item-list-skeleton-bg` | `var(--tc-surface-muted)` | Loading skeleton bar colour. |

```html
<!-- Uncontrolled: the element tracks its own active item -->
<tc-vertical-item-list id="settings" default-active-key="members"></tc-vertical-item-list>
<script>
  const el = document.getElementById('settings')
  el.items = [
    { key: 'general', icon: 'settings', text: 'General' },
    { key: 'members', icon: 'users', text: 'Members', badge: 12 },
    { key: 'billing', icon: 'credit-card', text: 'Billing' },
  ]
  const panels = {
    general: '<p>General settings…</p>',
    members: '<p>12 members…</p>',
    billing: '<p>Plan & invoices…</p>',
  }
  el.innerHTML = panels[el.getAttribute('default-active-key')]
  el.addEventListener('tc-select', e => { el.innerHTML = panels[e.detail.key] })
</script>
```

```html
<!-- Controlled: the parent owns the active item -->
<tc-vertical-item-list id="nav" active-key="general"></tc-vertical-item-list>
<script>
  const el = document.getElementById('nav')
  el.items = [
    { key: 'general', icon: 'settings', text: 'General' },
    { key: 'security', icon: 'shield', text: 'Security' },
  ]
  el.addEventListener('tc-select', e => el.setAttribute('active-key', e.detail.key))
</script>
```

---