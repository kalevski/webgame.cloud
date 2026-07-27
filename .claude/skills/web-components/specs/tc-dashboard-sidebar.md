---
component: tc-dashboard-sidebar
---

### tc-dashboard-sidebar

Vertical sidebar shell for dashboard layouts. Arranges three named slot regions — brand (top), menu (scrollable middle), panel (pinned bottom) — in a fixed-width column separated from the content by a 1px hairline on its trailing edge. No shadow, no border-radius; slate neutrals carry the design.

**Tag:** `tc-dashboard-sidebar`

**Attributes**

None. `tc-dashboard-sidebar` is a purely structural layout element with no configurable attributes.

**JS Properties**

None.

**Events**

None. `tc-dashboard-sidebar` is a purely presentational layout element.

**Slots**

| Slot | Description |
|------|-------------|
| `brand` | Top branding area (logo, wordmark, app name). Rendered inside `<div class="tc-dashboard-sidebar-brand">` at the top of the sidebar with a bottom hairline. |
| `menu` | Primary scrollable navigation list. Rendered inside `<nav class="tc-dashboard-sidebar-menu">` which flex-grows to fill available space with `overflow-y: auto`. |
| `panel` | Bottom panel (e.g. user account, version, footer links). Rendered inside `<div class="tc-dashboard-sidebar-panel">` pinned at the bottom with a top hairline divider. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-dashboard-sidebar-width` | `15rem` | Fixed width of the sidebar column. |
| `--bs-dashboard-sidebar-bg` | `var(--tc-surface-hover)` | Background of the sidebar. |
| `--bs-dashboard-sidebar-color` | `var(--tc-text)` | Default text color. |
| `--bs-dashboard-sidebar-border` | `var(--tc-border)` | Color of the trailing-edge hairline and region dividers. |
| `--bs-dashboard-sidebar-brand-padding` | `1rem` | Padding inside the brand region. |
| `--bs-dashboard-sidebar-menu-padding` | `0.5rem 0` | Padding inside the menu region. |
| `--bs-dashboard-sidebar-panel-padding` | `0.75rem 1rem` | Padding inside the panel region. |
| `--bs-dashboard-sidebar-panel-border` | `var(--tc-border)` | Color of the panel's top hairline divider. |

```html
<!-- Full three-region sidebar -->
<tc-dashboard-sidebar>
    <div slot="brand">MyApp</div>
    <nav slot="menu">
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
    </nav>
    <div slot="panel">user@example.com</div>
</tc-dashboard-sidebar>

<!-- Custom width -->
<tc-dashboard-sidebar style="--bs-dashboard-sidebar-width: 11rem">
    <div slot="brand">Narrow</div>
    <nav slot="menu"><a href="/">Home</a></nav>
</tc-dashboard-sidebar>
```

---