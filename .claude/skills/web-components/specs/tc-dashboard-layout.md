---
component: tc-dashboard-layout
---

### tc-dashboard-layout

Full-height dashboard shell: a full-height sidebar on the left, a glass navbar spanning the content column, and a scrollable content area. **Responsive:** below 992px the sidebar becomes a slide-in drawer over a dimmed backdrop (scoped to the component, not the viewport); at ≥992px it is pinned open as a static left rail and the toggle is hidden. Named slots cover the brand, menu, panel, and both navbar ends; unslotted children land in the main content. On mobile the drawer opens/closes via the toggle button, Ctrl+B (Cmd+B), backdrop tap, Escape, or the `sidebar-open` attribute. Dispatches `tc-toggle-sidebar` on every flip, plus a discrete `tc-sidebar-open` / `tc-sidebar-close`.

**Tag:** `tc-dashboard-layout`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sidebar-open` | boolean | *(unset)* | When present, the mobile drawer is open. Default closed; on desktop (≥992px) the rail is pinned open by CSS regardless of this attribute. Reflected by the `sidebarOpen` JS property. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `sidebarOpen` | `boolean` | Reflected from the `sidebar-open` boolean attribute. Set `true`/`false` to expand/collapse the sidebar programmatically. |
| `onToggleSidebar` | `((open: boolean) => void) \| null` | Optional callback invoked on every toggle alongside the `tc-toggle-sidebar` CustomEvent. Default `null`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-toggle-sidebar` | `{ open: boolean }` | Fired when the user toggles the sidebar via the button or keyboard shortcut. |
| `tc-sidebar-open` | — | Fired alongside `tc-toggle-sidebar` when a user-driven toggle opens the sidebar. No detail — bind one direction without reading `detail.open`. |
| `tc-sidebar-close` | — | Fired alongside `tc-toggle-sidebar` when a user-driven toggle closes the sidebar. No detail. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Main content — rendered inside `<main class="tc-dashboard-layout__content">`. |
| `navbar-left` | Content injected to the right of the sidebar-toggle button in the navbar. |
| `navbar-right` | Content pushed to the far right of the navbar. |
| `brand` | Logo / wordmark at the top of the sidebar, above the menu. |
| `sidebar-menu` | Scrollable menu region (middle of the sidebar). |
| `sidebar-panel` | Pinned panel at the bottom of the sidebar (user info, version badge, etc.). |

**Accessibility**

- The navbar is a `<nav role="navigation" aria-label="Application navigation">`.
- The sidebar is an `<aside role="navigation" aria-label="Sidebar navigation">`.
- The toggle `<button>` carries `aria-expanded` (updates in-place on toggle) and `aria-controls` tied to the sidebar's `id`.
- The toggle is reachable by Tab; Enter/Space activate it natively.
- Ctrl+B (Cmd+B) toggles the sidebar and Escape closes it from anywhere on the page; the handler is removed in `disconnectedCallback`.
- Tapping the dimmed backdrop closes the mobile drawer.
- A closed mobile drawer is `inert` + `aria-hidden` and goes `visibility: hidden` after the slide-out transition completes — it leaves the tab order and the accessibility tree (a translated-off drawer would otherwise keep its buttons focusable). At ≥992px the pinned rail is never inert.
- Closing while focus sits inside the drawer hands focus back to the toggle button (instead of dropping it on `body`).
- While the mobile drawer is open, Tab is trapped inside it — it is a modal surface over the dimmed content.
- Touch targets: the toggle is `44px × 44px` under `@media (pointer: coarse)`.
- `prefers-reduced-motion` disables the sidebar slide transition.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-dashboard-layout-navbar-height` | `3.75rem` | Height of the top navbar bar. |
| `--bs-dashboard-layout-navbar-bg` | `rgba(255,255,255,0.85)` | Navbar background (translucent glass). |
| `--bs-dashboard-layout-navbar-border` | `var(--tc-border)` | Hairline border below the navbar. |
| `--bs-dashboard-layout-navbar-color` | `var(--tc-text)` | Text/icon color in the navbar. |
| `--bs-dashboard-layout-navbar-padding-x` | `0.5rem` | Horizontal padding on the navbar. |
| `--bs-dashboard-layout-sidebar-width` | `15rem` | Expanded width of the sidebar. |
| `--bs-dashboard-layout-sidebar-bg` | `var(--tc-surface)` | Sidebar background. |
| `--bs-dashboard-layout-sidebar-border` | `var(--tc-border)` | Hairline borders on sidebar regions. |
| `--bs-dashboard-layout-sidebar-brand-padding` | `0.75rem 1rem` | Padding around the brand slot. |
| `--bs-dashboard-layout-sidebar-panel-padding` | `0.75rem 1rem` | Padding around the panel slot. |
| `--bs-dashboard-layout-content-bg` | `var(--tc-surface-hover)` | Background of the content rail. |
| `--bs-dashboard-layout-toggle-size` | `2.25rem` | Width and height of the toggle button. |
| `--bs-dashboard-layout-toggle-hover-bg` | `var(--tc-surface-muted)` | Toggle button hover background. |
| `--bs-dashboard-layout-overlay-bg` | `rgba(0,0,0,0.5)` | Dimmed backdrop behind the mobile drawer. |
| `--bs-dashboard-layout-transition` | `var(--tc-transition-base)` | Sidebar slide + backdrop fade transition. |

```html
<!-- Full layout -->
<tc-dashboard-layout style="height: 100vh">
  <div slot="brand">MyApp</div>
  <nav slot="sidebar-menu">
    <a href="/dashboard">Dashboard</a>
    <a href="/settings">Settings</a>
  </nav>
  <div slot="sidebar-panel">user@example.com</div>
  <span slot="navbar-left">/ Dashboard</span>
  <div slot="navbar-right"><button>New</button></div>
  <!-- default content -->
  <main style="padding:1.5rem">Page content here</main>
</tc-dashboard-layout>

<!-- Start with sidebar closed -->
<tc-dashboard-layout id="dl"></tc-dashboard-layout>
<script>
  document.getElementById('dl').sidebarOpen = false
  document.getElementById('dl').onToggleSidebar = open => console.log('sidebar open:', open)
</script>

<!-- Listen to toggle events -->
<tc-dashboard-layout id="dl2" style="height:100vh">
  <div slot="brand">App</div>
  <nav slot="sidebar-menu"><a href="/">Home</a></nav>
  <p style="padding:1rem">Content</p>
</tc-dashboard-layout>
<script>
  document.getElementById('dl2').addEventListener('tc-toggle-sidebar', e => {
    console.log('sidebar is now', e.detail.open ? 'open' : 'closed')
  })
</script>
```

---