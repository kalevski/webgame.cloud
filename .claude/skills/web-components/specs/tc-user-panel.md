---
component: tc-user-panel
---

### tc-user-panel

User profile panel with a circular avatar (image or initials chip), a display name, a plan micro-label, and a trailing settings icon button. When `menuItems` are supplied the name/plan area becomes a dropdown trigger that opens an overlay menu. Sharp corners (`border-radius: 0`) everywhere except the circular avatar (`50%`); slate neutrals throughout.

**Tag:** `tc-user-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `username` | string | — | Required display name. Used as the avatar `alt` / label and to derive initials when `initials` is absent. |
| `avatar-src` | string | — | Avatar image URL. When present, renders an `<img>`; otherwise a circular initials chip is shown. |
| `initials` | string | — | Fallback avatar text shown when `avatar-src` is absent. Derived from `username` when omitted. |
| `plan` | string | `Free` | Plan label rendered as an uppercase mono micro-label below the name. |
| `icon` | string | `settings` | Lucide icon name for the trailing icon button (rendered as inline SVG). `gear` aliases to `settings`. Set to e.g. `log-out` to repurpose the button as a direct sign-out action. |
| `icon-label` | string | `Settings` | Accessible label (`aria-label`) for the trailing icon button. Override it whenever `icon` is changed (e.g. `"Sign out"`). |
| `icon-highlighted` | boolean | `false` | Applies the rare cyan `--tc-accent` accent to the icon button. |
| `loading` | boolean | `false` | Renders skeleton avatar/name/plan placeholders and disables interaction. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `menuItems` | `UserPanelMenuItem[]` | `[]` | Dropdown menu items — each `{ key: string, label: string, icon?: string }`. When non-empty, the panel becomes a dropdown trigger. |
| `onIconClick` | `(() => void) \| null` | `null` | Callback invoked alongside `tc-icon-click` when the icon button is clicked. Wire it (with `icon="log-out"` / `icon-label="Sign out"`) for a dropdown-free sign-out action. |
| `onMenuClick` | `((key: string) => void) \| null` | `null` | Callback invoked alongside `tc-menu-click` when a menu item is chosen. |

Each attribute is also reflected as a same-named JS property (e.g. `avatarSrc`, `iconHighlighted`).

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-icon-click` | `{}` | Fired (bubbles, composed) when the settings icon button is clicked. |
| `tc-menu-click` | `{ key: string }` | Fired (bubbles, composed) when a menu item is activated by click or keyboard. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

The trailing icon button is a real `<button>` whose `aria-label` is the `icon-label` attribute (defaulting to `"Settings"`) — set it to match the icon's meaning (e.g. `"Sign out"`). When `menuItems` are present the name/plan trigger carries `role="button"`, `aria-haspopup="menu"`, and `aria-expanded`; the menu has `role="menu"` and items `role="menuitem"`. Outside-click and `Escape` close the menu (`Escape` returns focus to the trigger); arrow keys / Home / End move between items. Icons are decorative (`aria-hidden`); the avatar image carries `alt` text (the initials chip is labelled).

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-user-panel-bg` | `var(--tc-surface)` | Panel background |
| `--bs-user-panel-gap` | `0.625rem` | Gap between avatar / info / icon |
| `--bs-user-panel-avatar-size` | `2rem` | Circular avatar diameter |
| `--bs-user-panel-avatar-bg` | `var(--tc-app-accent)` | Initials chip background |
| `--bs-user-panel-avatar-color` | `#fff` | Initials chip text color |
| `--bs-user-panel-name-color` | `var(--tc-text)` | Display name color |
| `--bs-user-panel-plan-color` | `var(--tc-text-muted)` | Plan micro-label color |
| `--bs-user-panel-trigger-hover-bg` | `var(--tc-surface-muted)` | Trigger (info) hover fill |
| `--bs-user-panel-icon-color` | `var(--tc-text-muted)` | Settings icon color |
| `--bs-user-panel-icon-hover-bg` | `var(--tc-surface-muted)` | Settings icon hover fill |
| `--bs-user-panel-icon-active-bg` | `var(--tc-app-accent)` | Settings icon active fill |
| `--bs-user-panel-icon-highlight-color` | `var(--tc-accent)` | Highlighted icon accent |
| `--bs-user-panel-menu-bg` | `var(--tc-surface)` | Dropdown menu background |
| `--bs-user-panel-menu-border-color` | `var(--tc-border)` | Dropdown menu hairline |
| `--bs-user-panel-menu-shadow` | `var(--tc-shadow-lg)` | Dropdown overlay shadow |
| `--bs-user-panel-menu-item-hover-bg` | `var(--tc-surface-muted)` | Menu item hover fill |
| `--bs-user-panel-menu-item-active-bg` | `var(--tc-app-accent)` | Menu item active fill |
| `--bs-user-panel-skeleton-bg` | `var(--tc-surface-muted)` | Loading skeleton fill |

```html
<!-- Avatar image, Pro plan -->
<tc-user-panel avatar-src="https://example.com/jane.jpg" username="Jane Smith" plan="Pro"></tc-user-panel>

<!-- Initials fallback, highlighted settings icon -->
<tc-user-panel username="Daniel Kalevski" initials="DK" icon-highlighted></tc-user-panel>

<!-- Icon as a direct sign-out action (no dropdown) -->
<tc-user-panel id="up-signout" username="Daniel Kalevski" plan="Pro" icon="log-out" icon-label="Sign out"></tc-user-panel>
<script>
  document.querySelector('#up-signout').addEventListener('tc-icon-click', () => signOut())
</script>

<!-- With dropdown menu + events -->
<tc-user-panel id="up" username="Daniel Kalevski" plan="Pro"></tc-user-panel>
<script>
  const up = document.querySelector('#up')
  up.menuItems = [
    { key: 'profile', label: 'Profile', icon: 'user' },
    { key: 'billing', label: 'Billing', icon: 'credit-card' },
    { key: 'signout', label: 'Sign out', icon: 'log-out' },
  ]
  up.addEventListener('tc-icon-click', () => console.log('settings'))
  up.addEventListener('tc-menu-click', e => console.log('menu:', e.detail.key))
</script>

<!-- Loading skeleton -->
<tc-user-panel loading></tc-user-panel>
```

---