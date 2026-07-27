---
component: tc-cool-nav
---

### tc-cool-nav

Responsive navigation bar with collapsible hamburger menu, scroll-detection condensed state, brand slot, right-side slot, and a login CTA. Toolcase motif: translucent surface, 1px hairline, sharp corners, JetBrains Mono brand wordmark with the cyan accent dot, underline-only active marker.

**Tag:** `tc-cool-nav`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `brand` | string | — | Text brand/logo label. Renders a mono wordmark with the cyan dot. When absent, use `slot="brand"` instead. |
| `login-label` | string | `'Log in'` | Text for the login CTA button/link. |
| `login-href` | string | — | Href for the login CTA. Renders an `<a>` when set, a `<button>` otherwise. |
| `login-variant` | string | `'primary'` | Bootstrap button variant for the login CTA (e.g. `primary`, `secondary`, `outline-primary`). |
| `scroll-offset` | number | `10` | `window.scrollY` threshold above which the `tc-cool-nav-scrolled` class is applied to the host (condensed padding + shadow). |
| `expand-breakpoint` | string | `'lg'` | Viewport breakpoint at and above which the full menu is shown and the toggler is hidden. Values: `sm`, `md`, `lg`, `xl`, `xxl`. |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme. `dark` uses the `--tc-ink` dark surface with light text. |
| `sticky` | boolean | false | When present, the nav is `position: sticky` at the top with `z-index: var(--tc-z-sticky)`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `CoolNavItem[]` | Array of nav-link descriptors. Each: `{ label: string; href: string; active?: boolean }`. Setting re-renders the link list. |
| `brand` | `string \| null` | Reflects the `brand` attribute. |
| `loginLabel` | `string` | Reflects `login-label`. |
| `loginHref` | `string \| null` | Reflects `login-href`. |
| `loginVariant` | `string` | Reflects `login-variant`. |
| `scrollOffset` | `number` | Reflects `scroll-offset`. |
| `expandBreakpoint` | `string` | Reflects `expand-breakpoint`. |
| `theme` | `CoolNavTheme` | Reflects `theme`. |
| `sticky` | `boolean` | Reflects the `sticky` attribute. |
| `onNavToggle` | `((open: boolean) => void) \| null` | Optional callback fired alongside `tc-nav-toggle`. |
| `onLogin` | `(() => void) \| null` | Optional callback fired alongside `tc-login`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-nav-toggle` | `{ open: boolean }` | Fired when the hamburger toggler opens or closes the mobile menu. |
| `tc-login` | `{}` | Fired when the login CTA is activated (click on the button variant — not the link variant). |

**Slots**

| Slot | Description |
|------|-------------|
| `brand` | Rich brand content (logo + text, custom markup). Used when the `brand` attribute is absent. Rendered inside `.tc-cool-nav-brand-slot`. |
| `right` | Extra controls placed between the nav items and the login CTA (e.g. search, icon buttons). |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cool-nav-bg` | `var(--tc-surface)` | Nav background (light mode). |
| `--bs-cool-nav-color` | `var(--tc-text)` | Nav text color. |
| `--bs-cool-nav-border` | `var(--tc-border)` | 1px hairline bottom border + collapse border color. |
| `--bs-cool-nav-brand-color` | `var(--tc-text)` | Brand wordmark color. |
| `--bs-cool-nav-brand-dot` | `var(--tc-accent)` | Color of the 7×7px accent square in the brand. |
| `--bs-cool-nav-link-color` | `var(--tc-text-muted)` | Nav link default color. |
| `--bs-cool-nav-link-hover-color` | `var(--tc-accent-fg)` | Nav link hover color. |
| `--bs-cool-nav-link-active-color` | `var(--tc-text)` | Active nav link text color. |
| `--bs-cool-nav-link-active-line` | `var(--tc-app-accent)` | 2px underline color on the active link (large viewports). |
| `--bs-cool-nav-toggler-color` | `var(--tc-text)` | Hamburger icon color. |
| `--bs-cool-nav-collapse-bg` | `var(--tc-surface)` | Background of the mobile dropdown. |
| `--bs-cool-nav-scrolled-shadow` | `0 1px 8px 0 rgba(0,0,0,.06)` | Shadow applied when scrolled. |
| `--bs-cool-nav-py` | `0.75rem` | Vertical padding in the normal state. |
| `--bs-cool-nav-scrolled-py` | `0.5rem` | Vertical padding in the scrolled/condensed state. |

```html
<!-- Attribute brand + login CTA -->
<tc-cool-nav
  brand="myapp"
  login-label="Get started"
  login-href="/signup"
  sticky
></tc-cool-nav>
<script>
  document.querySelector('tc-cool-nav').items = [
    { label: 'Home',    href: '/',       active: true },
    { label: 'Docs',    href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
  ]
</script>

<!-- Brand slot + right slot -->
<tc-cool-nav login-label="Sign in" login-href="/login">
  <span slot="brand">
    <img src="/logo.svg" alt="MyApp" height="28" />
  </span>
  <span slot="right">
    <button class="btn btn-sm btn-ghost">Changelog</button>
  </span>
</tc-cool-nav>

<!-- Dark theme -->
<tc-cool-nav brand="myapp" theme="dark" login-label="Log in" login-href="/login"></tc-cool-nav>

<!-- Listen for events -->
<script>
  const nav = document.querySelector('tc-cool-nav')
  nav.addEventListener('tc-nav-toggle', e => console.log('open:', e.detail.open))
  nav.addEventListener('tc-login', () => console.log('login clicked'))
</script>
```

---