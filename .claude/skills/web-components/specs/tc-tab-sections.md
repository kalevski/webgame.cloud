---
component: tc-tab-sections
---

### tc-tab-sections

Tabbed interface with switchable content sections and an optional loading skeleton. Underline tab nav — the only chrome is a 2px ink underline under the active tab. Tabs are set via the `items` JS property (array of `TabSectionItem`). Supports uncontrolled mode (`default-active-key`) and controlled mode (`active-key` — the active tab is driven by the attribute and the element only emits on click). Full ARIA tabs pattern with roving tabindex: Left/Right (and Home/End) move and activate, Enter/Space activate, disabled tabs are skipped. Only the active panel is shown; others are hidden. No shadow DOM.

**Tag:** `tc-tab-sections`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `default-active-key` | string | first non-disabled item | Initial active tab when uncontrolled. Ignored once the user switches tabs or when `active-key` is present. |
| `active-key` | string | absent | When present the component is **controlled** — the active tab is driven by this attribute and does not change on click (the element only emits `tc-change`). |
| `loading` | boolean | absent | Replaces the tab nav and panel with a placeholder skeleton. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `TabSectionItem[]` | `[]` | The tabs. Each item: `{ key: string; label: string; content: string; icon?: string; disabled?: boolean }`. `content` is an HTML/text string rendered into the panel; `icon` is a lucide icon name. Set via JS; not reflected as an attribute. |
| `onchangetab` | function | `null` | Optional callback fired on tab activation — receives the activated `key`. (Named `onchangetab` to avoid clashing with the DOM `onchange`.) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ key: string }` | Fired when a tab is activated (click or keyboard). In controlled mode it fires without changing the displayed tab. |

**Slots:** none — content is supplied through the `items` property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tab-sections-nav-border` | `1px solid var(--tc-border)` | Hairline under the whole tablist. |
| `--bs-tab-sections-tab-color` | `var(--tc-text-muted)` | Inactive tab text colour. |
| `--bs-tab-sections-tab-color-hover` | `var(--tc-text)` | Hover tab text colour. |
| `--bs-tab-sections-tab-color-active` | `var(--tc-text)` | Active tab text colour. |
| `--bs-tab-sections-tab-underline` | `2px solid var(--tc-app-accent)` | 2px ink underline on the active tab. |
| `--bs-tab-sections-tab-icon-size` | `0.9375rem` | Inline tab icon size. |
| `--bs-tab-sections-panel-padding` | `1rem 0` | Padding around the active panel. |
| `--bs-tab-sections-skeleton-bg` | `var(--tc-slate-200)` | Loading skeleton bar colour. |

```html
<!-- Uncontrolled -->
<tc-tab-sections id="docs" default-active-key="install"></tc-tab-sections>
<script>
  document.getElementById('docs').items = [
    { key: 'overview', label: 'Overview', content: '<p>Overview…</p>' },
    { key: 'install', label: 'Install', icon: 'download', content: '<p>Install…</p>' },
    { key: 'legacy', label: 'Legacy', disabled: true, content: '<p>Unreachable</p>' },
  ]
  document.getElementById('docs').addEventListener('tc-change', e => {
    console.log('Active tab:', e.detail.key)
  })
</script>
```

```html
<!-- Controlled: the parent owns the active tab -->
<tc-tab-sections id="settings" active-key="account"></tc-tab-sections>
<script>
  const el = document.getElementById('settings')
  el.items = [
    { key: 'account', label: 'Account', content: '<p>Account…</p>' },
    { key: 'billing', label: 'Billing', content: '<p>Billing…</p>' },
  ]
  el.addEventListener('tc-change', e => el.setAttribute('active-key', e.detail.key))
</script>
```

---