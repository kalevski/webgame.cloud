---
component: tc-social-links
---

### tc-social-links

Horizontal row of social-media icon-button links. Each link is a square icon button with sharp corners, slate neutrals, and accessible labels. Two visual variants (`ghost` / `filled`) and three sizes (`sm` / `md` / `lg`). The `links` array is set via a JS property — not an attribute.

**Tag:** `tc-social-links`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | `sm\|md\|lg` | `md` | Button size. `sm` = 32px, `md` = 40px, `lg` = 48px (all expand to 44px minimum on coarse pointers) |
| `variant` | `ghost\|filled` | `ghost` | Visual style. `ghost` = transparent at rest, slate well on hover. `filled` = slate-100 surface at rest, slate-200 + 1px lift on hover |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `links` | `SocialLink[]` | `[]` | Array of link objects. Setting this property triggers a re-render |

**`SocialLink` shape**

```ts
interface SocialLink {
    kind: SocialKind   // which social network
    href: string       // destination URL
    label?: string     // accessible name; defaults to the kind string when absent
}
```

**`SocialKind` values**

`'github' | 'x' | 'linkedin' | 'mastodon' | 'youtube' | 'rss' | 'discord' | 'instagram' | 'tiktok'`

**Events**

None. Links navigate natively via the rendered `<a>` elements.

**Slots**

None. All content is generated from the `links` property.

**Accessibility**

- Each link is a real `<a>` element with `aria-label` (from `label` or `kind`), `target="_blank"`, and `rel="noopener noreferrer"`.
- Icons are decorative (`aria-hidden="true"`).
- The host carries `role="list"`; each `<a>` carries `role="listitem"`.
- Focus ring visible via `:focus-visible` (2px `--tc-app-accent` outline, offset 2px).
- 44px touch targets enforced at all sizes on coarse pointers.
- `prefers-reduced-motion` suppresses the hover lift; color/background transitions are preserved.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-social-links-btn-size` | `40px` | Square button dimension (overridden by size modifier) |
| `--bs-social-links-icon-size` | `1.25rem` | SVG icon width and height (overridden by size modifier) |
| `--bs-social-links-gap` | `0.25rem` | Gap between link buttons |
| `--bs-social-links-color` | `var(--tc-text-muted)` | Glyph color at rest |
| `--bs-social-links-bg` | `transparent` | Button background at rest |
| `--bs-social-links-border` | `transparent` | Button border color at rest |
| `--bs-social-links-hover-color` | `var(--tc-text)` | Glyph color on hover |
| `--bs-social-links-hover-bg` | `var(--tc-surface-muted)` | Button background on hover |
| `--bs-social-links-hover-border` | `transparent` | Button border color on hover |
| `--bs-social-links-hover-shadow` | `none` | Box shadow on hover |
| `--bs-social-links-hover-translate` | `0` | Vertical lift on hover (filled: `-1px`) |

```html
<!-- Ghost (default) — transparent, slate text -->
<tc-social-links id="social"></tc-social-links>
<script>
document.getElementById('social').links = [
    { kind: 'github', href: 'https://github.com/example' },
    { kind: 'x', href: 'https://x.com/example', label: 'X (Twitter)' },
    { kind: 'linkedin', href: 'https://linkedin.com/in/example' },
]
</script>

<!-- Filled, large -->
<tc-social-links id="social2" variant="filled" size="lg"></tc-social-links>
<script>
document.getElementById('social2').links = [
    { kind: 'github', href: '#' },
    { kind: 'rss', href: '#', label: 'RSS Feed' },
    { kind: 'youtube', href: '#' },
]
</script>

<!-- All kinds -->
<tc-social-links id="all" variant="filled"></tc-social-links>
<script>
document.getElementById('all').links = [
    { kind: 'github', href: '#' },
    { kind: 'x', href: '#' },
    { kind: 'linkedin', href: '#' },
    { kind: 'mastodon', href: '#' },
    { kind: 'youtube', href: '#' },
    { kind: 'rss', href: '#' },
    { kind: 'discord', href: '#' },
    { kind: 'instagram', href: '#' },
    { kind: 'tiktok', href: '#' },
]
</script>
```

---