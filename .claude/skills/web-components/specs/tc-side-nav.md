---
component: tc-side-nav
---

### tc-side-nav

Vertical navigation menu organised into sections of items, each with an optional lucide icon, a label, and an optional badge. Renders a `<nav>` landmark containing one block per section (optional mono uppercase title + a list of items). Each item is an `<a>` when `href` is set (otherwise a `<button>`). The active item carries `.active` + `aria-current="page"` and shows a 2px ink marker on the left edge with a promoted label (not a full fill box); disabled items are `aria-disabled` and unfocusable. A `loading` state renders skeleton rows instead of the sections.

**Tag:** `tc-side-nav`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `loading` | boolean | `false` | When present, replaces the sections with `loading-count` animated skeleton rows. |
| `loading-count` | number | `5` | Number of skeleton rows shown while `loading`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sections` | `SideNavSection[]` | `[]` | Array of sections to render. Setting triggers a re-render. |
| `onItemClick` | `((event: Event, item: SideNavItem) => void) \| null` | `null` | Optional callback invoked when an item is activated (alongside the `tc-item-click` event). |

**`SideNavSection` shape**

```ts
interface SideNavSection {
    key?: string      // Optional stable identifier
    title?: string    // Optional mono uppercase section heading
    items: SideNavItem[]
}
```

**`SideNavItem` shape**

```ts
interface SideNavItem {
    key?: string       // Stable identifier (echoed in the tc-item-click detail)
    label: string      // Visible label text
    icon?: string      // lucide icon name (kebab-case) → inline SVG
    href?: string      // When set, item renders as an <a> (else a <button>)
    active?: boolean   // Marks the current page (.active + aria-current="page")
    badge?: string     // Optional trailing badge text
    target?: string    // <a> target (only when href is set)
    rel?: string       // <a> rel (only when href is set)
    disabled?: boolean // Renders inert + aria-disabled, not clickable
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-item-click` | `{ item: SideNavItem, key: string }` | Fired (bubbles, composed) when a non-disabled item is activated. `key` is `item.key` or a `${sectionIndex}-${itemIndex}` fallback. Navigation is not suppressed when `href` is set (unless the item is disabled). |

**Slots**

None. All data is supplied via the `sections` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-side-nav-padding-y` | `0.5rem` | Vertical padding of the nav. |
| `--bs-side-nav-section-title-color` | `var(--tc-text-faint)` | Section title colour. |
| `--bs-side-nav-section-title-letter-spacing` | `0.08em` | Section title tracking. |
| `--bs-side-nav-item-color` | `var(--tc-text-muted)` | Resting label colour. |
| `--bs-side-nav-item-hover-bg` | `var(--tc-surface-muted)` | Hover well background. |
| `--bs-side-nav-item-active-color` | `var(--tc-text)` | Active item label colour. |
| `--bs-side-nav-marker-color` | `var(--tc-app-accent)` | Left-edge active marker colour. |
| `--bs-side-nav-marker-width` | `2px` | Left-edge active marker width. |
| `--bs-side-nav-icon-color` | `var(--tc-text-faint)` | Resting icon tint. |
| `--bs-side-nav-badge-bg` | `var(--tc-app-accent)` | Badge background. |
| `--bs-side-nav-badge-color` | `#fff` | Badge text colour. |
| `--bs-side-nav-focus-color` | `var(--tc-app-accent)` | `:focus-visible` outline colour. |

```html
<tc-side-nav id="nav"></tc-side-nav>
<script>
  const nav = document.getElementById('nav')
  nav.sections = [
    {
      key: 'main',
      title: 'Main',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '#dashboard', active: true },
        { key: 'projects',  label: 'Projects',  icon: 'folder-kanban',    href: '#projects', badge: '12' },
        { key: 'billing',   label: 'Billing',   icon: 'credit-card',      disabled: true },
      ],
    },
  ]
  nav.addEventListener('tc-item-click', e => console.log(e.detail.key))
</script>

<!-- Loading state -->
<tc-side-nav loading loading-count="6"></tc-side-nav>
```

---