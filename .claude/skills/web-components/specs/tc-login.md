---
component: tc-login
---

### tc-login

**Tag:** `tc-login`

Two-column login layout: a decorative ink aside (left, carries the background pattern) and a white form column (right, carries a logo slot, title, description, and a vertical stack of OAuth connect buttons). Collapses to single-column (form only) on narrow screens.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `'Sign in'` | Heading text rendered as an `<h2>` in the form column. |
| `description` | string | absent | Sub-heading paragraph rendered below the title. |
| `background-pattern-src` | string | absent | URL of an image used as the aside's background. Rendered as a full-bleed `<img>` with `mix-blend-mode: luminosity`. |
| `loading` | boolean | absent | When present, replaces the form content with animated skeleton placeholders and sets `aria-busy="true"` on the host. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `connect` | `LoginConnectOption[]` | `[]` | Array of OAuth provider options. Each item renders one button in the form column. |
| `onconnect` | `function or null` | `null` | Optional callback fired alongside `tc-connect` when an OAuth button is clicked. Receives the provider `key` string. |

**LoginConnectOption shape**

```ts
interface LoginConnectOption {
  key: string                                                              // unique provider key — returned in tc-connect event detail
  label: string                                                            // button label text
  icon?: string                                                            // lucide icon name (kebab-case), rendered aria-hidden before the label
  variant?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'  // button outline variant; defaults to 'primary'
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-connect` | `{ key: string }` | Dispatched (bubbles) when an OAuth button is clicked. `key` matches the clicked `LoginConnectOption.key`. |

**Slots**

| Slot | Description |
|------|-------------|
| `logo` | Brand logo or wordmark placed above the form title. Hidden when empty. |
| `pattern` | Rich decorative content placed inside the aside overlay (stacked above the `background-pattern-src` image when both are provided). |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-login-aside-width` | `42%` | Width of the decorative aside column. |
| `--bs-login-min-height` | `100vh` | Minimum height of the login component. |
| `--bs-login-column-divider` | `1px solid var(--tc-border)` | Hairline between the aside and form columns. |
| `--bs-login-aside-bg` | `var(--tc-ink)` | Aside background colour. |
| `--bs-login-form-bg` | `var(--tc-surface)` | Form column background colour. |
| `--bs-login-form-padding-x` | `3rem` | Form column horizontal padding. |
| `--bs-login-form-padding-y` | `3rem` | Form column vertical padding. |
| `--bs-login-form-max-width` | `28rem` | Max-width of the inner form content. |
| `--bs-login-title-font-size` | `1.5rem` | Title heading font size. |
| `--bs-login-title-font-weight` | `600` | Title heading font weight (≤ 600 per design rules). |
| `--bs-login-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-login-desc-color` | `var(--tc-text-muted)` | Description text colour. |
| `--bs-login-connect-gap` | `0.625rem` | Gap between connect buttons. |
| `--bs-login-connect-btn-height` | `2.75rem` | Height of each connect button. |
| `--bs-login-connect-margin-top` | `1.75rem` | Space above the connect button group. |

**Example**

```html
<tc-login id="login"
  title="Sign in"
  description="Choose a provider to continue."
  background-pattern-src="/img/pattern.svg">
  <img slot="logo" src="/img/logo.svg" alt="My App" />
</tc-login>

<script>
  const login = document.getElementById('login')

  login.connect = [
    { key: 'github',  label: 'Continue with GitHub',  icon: 'github',  variant: 'primary'   },
    { key: 'google',  label: 'Continue with Google',  icon: 'mail',    variant: 'secondary' },
    { key: 'sso',     label: 'Continue with SSO',     icon: 'shield',  variant: 'secondary' },
  ]

  login.addEventListener('tc-connect', function(e) {
    console.log('provider selected:', e.detail.key)
  })
</script>
```

```html
<!-- Loading state -->
<tc-login title="Sign in" loading></tc-login>

<script>
  // Once providers are fetched, populate and clear loading:
  const el = document.querySelector('tc-login')
  el.connect = [{ key: 'github', label: 'Continue with GitHub', variant: 'primary' }]
  el.removeAttribute('loading')
</script>
```

---