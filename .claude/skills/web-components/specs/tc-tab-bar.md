---
component: tc-tab-bar
---

### tc-tab-bar

Horizontal tab switcher bar. Tabs are set via the `tabs` JS property (array of `TabBarItem`). The only chrome is a 2px ink underline on the active tab and a 1px hairline below the whole bar. Supports `sm` and `md` size variants. Full ARIA tablist keyboard navigation: ArrowLeft/Right move between tabs (wrapping), Home/End jump to first/last, Enter/Space activate. Disabled tabs are visually dimmed and skipped by keyboard navigation. No shadow DOM.

**Tag:** `tc-tab-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active-id` | string | `''` | The `id` of the currently active tab. Setting this attribute triggers an in-place DOM patch (no full re-render). |
| `size` | `'sm' \| 'md'` | `'md'` | Size variant. `sm` reduces padding and font size. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tabs` | `TabBarItem[]` | `[]` | The tab items. Each item: `{ id: string; label: string; icon?: string; disabled?: boolean }`. `icon` is a lucide icon name (kebab-case). Set via JS; not reflected as an attribute. |
| `onChange` | function | `null` | Optional callback fired on tab activation — receives the activated `id`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ id: string }` | Fired when a tab is activated (click or keyboard). |

**Slots:** none — tabs are supplied via the `tabs` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tab-bar-gap` | `0.125rem` | Gap between tab buttons. |
| `--bs-tab-bar-border` | `1px solid var(--tc-border)` | Hairline below the tablist. |
| `--bs-tab-bar-tab-padding` | `0.5rem 0.875rem` | Tab button padding. |
| `--bs-tab-bar-tab-font-size` | `0.8125rem` | Tab label font size. |
| `--bs-tab-bar-tab-color` | `var(--tc-text-muted)` | Inactive tab text colour. |
| `--bs-tab-bar-tab-color-hover` | `var(--tc-text)` | Hover tab text colour. |
| `--bs-tab-bar-tab-color-active` | `var(--tc-text)` | Active tab text colour. |
| `--bs-tab-bar-tab-underline` | `2px solid var(--tc-app-accent)` | 2px ink underline on the active tab. |
| `--bs-tab-bar-tab-icon-size` | `0.9375rem` | Inline tab icon size. |

```html
<tc-tab-bar id="nav" active-id="overview"></tc-tab-bar>
<script>
  const bar = document.getElementById('nav')
  bar.tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'install',  label: 'Install', icon: 'download' },
    { id: 'usage',    label: 'Usage',   icon: 'book-open' },
    { id: 'legacy',   label: 'Legacy',  disabled: true },
  ]
  bar.addEventListener('tc-change', e => {
    console.log('Active tab:', e.detail.id)
  })
</script>
```

---