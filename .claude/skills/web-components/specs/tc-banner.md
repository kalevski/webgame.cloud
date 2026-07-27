---
component: tc-banner
---

### tc-banner

Status banner with a leading icon, body content, an optional action slot or CTA link, and optional localStorage-backed dismissal. Emits `tc-dismiss` when closed. Uses `role="status"` (or `role="alert"` for the error variant) for screen reader announcements.

**Tag:** `tc-banner`

**Preset alias:** `tc-announcement-bar` is a persistent-announcement preset of `tc-banner` — `role="region"`, no auto per-variant icon, and the legacy `persist-dismiss-key` / `icon-name` attribute names (mapping to `storage-key` / `icon`). Everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `info\|warning\|success\|error\|announce` | `info` | Color/tone variant. Selects the left border color, background tint, and default icon. `announce` is the cyan brand-announcement tone (used by the announcement-bar preset). |
| `dismissible` | boolean | false | Show a close button. Clicking it hides the banner and fires `tc-dismiss`. |
| `storage-key` | string | — | localStorage key. On connect, if the key is already stored as `"dismissed"`, the banner hides immediately. Clicking close writes the flag so dismissal persists across reloads. (The `tc-announcement-bar` preset reads `persist-dismiss-key` instead.) |
| `icon` | string | — | Kebab-case lucide icon name (e.g. `"bell"`, `"rocket"`). Overrides the per-variant default icon (`info` → `info`, `warning` → `triangle-alert`, `success` → `circle-check`, `error` → `circle-x`). (The preset reads `icon-name` instead, and has no per-variant default.) |
| `cta-label` | string | — | CTA link text. Rendered as a `.tc-banner-cta` link only when `cta-href` is also set. |
| `cta-href` | string | — | CTA link URL. Rendered only when `cta-label` is also set. |
| `class` | string | — | Extra classes applied directly to the host element. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `onDismiss` | `(() => void) \| null` | Optional callback fired alongside the `tc-dismiss` event when the banner is dismissed. |
| `variant` / `dismissible` / `storageKey` / `iconName` / `ctaLabel` / `ctaHref` | — | Reflect the matching attributes. `storageKey` / `iconName` adapt to the tag's attribute names. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-dismiss` | — | Fired (bubbles, composed) when the close button is clicked. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Banner body text / HTML. Rendered inside `.tc-banner-content`. |
| `icon` | Optional leading icon element. Overrides the `icon` / `icon-name` lucide fallback when present. |
| `action` | Optional action element (button, link). Rendered inside `.tc-banner-action` on the right side of the banner. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-banner-padding-x` | `1rem` | Horizontal padding. |
| `--bs-banner-padding-y` | `0.85rem` | Vertical padding. |
| `--bs-banner-font-size` | `0.9rem` | Banner text size. |
| `--bs-banner-gap` | `0.75rem` | Gap between icon, content, action, and close button. |
| `--bs-banner-border-width` | `4px` | Left border width. |
| `--bs-banner-border-color` | `var(--tc-info)` | Left border and icon color (set by variant). |
| `--bs-banner-bg` | gradient | 135° tinted gradient fill (set by variant). |
| `--bs-banner-color` | emphasis | Dark emphasis text color (set by variant). |
| `--bs-banner-icon-size` | `1rem` | Width/height of the leading icon SVG. |
| `--bs-banner-cta-color` | border color | CTA link color (falls back to the variant border color). |
| `--bs-banner-close-size` | `28px` | Size of the dismiss button (44px on coarse pointer devices). |

```html
<!-- Info (default) -->
<tc-banner>New documentation is available — check it out.</tc-banner>

<!-- Error variant uses role="alert" for immediate announcement -->
<tc-banner variant="error">Failed to connect to the server.</tc-banner>

<!-- Custom icon -->
<tc-banner variant="info" icon="bell">You have 3 unread notifications.</tc-banner>

<!-- With action slot -->
<tc-banner variant="info">
  A new version is available.
  <tc-button slot="action" variant="primary" size="sm">Update now</tc-button>
</tc-banner>

<!-- Dismissible with persistent storage -->
<tc-banner variant="warning" dismissible storage-key="my-app-banner">
  Maintenance window on Sunday 02:00 UTC.
</tc-banner>

<!-- Announcement-bar preset (region role, CTA link, announce tone) -->
<tc-announcement-bar variant="announce" icon-name="megaphone"
  cta-label="Learn more" cta-href="/changelog">
  Toolcase v3 is now open-source.
</tc-announcement-bar>
```

---