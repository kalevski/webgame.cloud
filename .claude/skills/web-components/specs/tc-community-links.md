---
component: tc-community-links
---

### tc-community-links

Grid of community platform links (GitHub, Discord, X, YouTube, etc.) with icons, labels, optional descriptions, and optional counts. Purely presentational — no callbacks or events.

**Tag:** `tc-community-links`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Optional plain-text heading rendered above the grid. Use `slot="title"` for rich content. When both are absent, no header is rendered. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Reflects the `title` attribute. |
| `links` | `CommunityLink[]` | Array of link entries to render. Set via JS property. Default: `[]`. Re-renders on assignment. |

`CommunityLink` shape:
```ts
interface CommunityLink {
    label: string           // visible name; used in aria-label
    href: string            // anchor href
    icon?: string           // platform key (e.g. "github", "discord", "twitter") or PascalCase lucide icon name
    count?: number | string // optional metric (stars, members, etc.) shown as mono micro-label
    description?: string    // optional secondary line below the label
}
```

Common `icon` values: `github`, `discord`, `twitter`, `x`, `linkedin`, `youtube`, `mastodon`, `instagram`, `rss`, `slack`, `twitch`, `facebook`, `reddit`, `forum`, `chat`, `community`, `docs`, `blog`, `website`, `link`. Unknown keys fall back to a generic link icon.

**Events**

None. `tc-community-links` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich heading content rendered above the grid. Used when the `title` attribute is absent. |

**Accessibility**

Each card is a real `<a>` with an `aria-label` that includes both the label and the count (if present). The icon SVG is `aria-hidden`. Focus ring is always visible (cyan, `--tc-app-accent`). `prefers-reduced-motion` suppresses the 1 px lift on hover.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-community-links-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-community-links-border` | `var(--tc-border)` | Hairline color used as the 1px gap between cards. |
| `--bs-community-links-gap` | `1px` | Gap between cards (also acts as the hairline separator). |
| `--bs-community-links-color` | `var(--tc-text)` | Label and body text color. |
| `--bs-community-links-muted` | `var(--tc-text-muted)` | Description and count text color. |
| `--bs-community-links-icon-size` | `1.375rem` | Platform icon size. |
| `--bs-community-links-icon-color` | `var(--tc-text-muted)` | Platform icon color. |
| `--bs-community-links-hover-bg` | `var(--tc-surface-muted)` | Card background on hover. |
| `--bs-community-links-hover-shadow` | `0 1px 4px rgba(0,0,0,0.07)` | Shadow on hover. |
| `--bs-community-links-hover-translate` | `-1px` | Vertical lift on hover (`translateY`). |
| `--bs-community-links-title-color` | `var(--tc-text)` | Heading text color. |
| `--bs-community-links-count-color` | `var(--tc-text-muted)` | Count micro-label color. |
| `--bs-community-links-count-size` | `0.6875rem` | Count micro-label font size. |
| `--bs-community-links-count-spacing` | `0.08em` | Count micro-label letter-spacing. |
| `--bs-community-links-card-padding-y` | `0.875rem` | Card vertical padding. |
| `--bs-community-links-card-padding-x` | `1rem` | Card horizontal padding. |
| `--bs-community-links-columns` | `2` | Grid column count (overridden to 3 at ≥768px, 4 at ≥992px). |

```html
<!-- Minimal: links via JS property -->
<tc-community-links id="cl" title="Community"></tc-community-links>
<script>
    document.getElementById('cl').links = [
        { label: 'GitHub', href: 'https://github.com/org/repo', icon: 'github', count: '12.4k' },
        { label: 'Discord', href: 'https://discord.gg/invite', icon: 'discord', count: '8.2k' },
        { label: 'Twitter', href: 'https://twitter.com/org', icon: 'twitter', count: '5.1k' },
    ]
</script>

<!-- With descriptions -->
<tc-community-links id="cl2" title="Community & resources"></tc-community-links>
<script>
    document.getElementById('cl2').links = [
        { label: 'GitHub', href: '#', icon: 'github', count: '12.4k', description: 'Source & issues' },
        { label: 'Discord', href: '#', icon: 'discord', count: '8.2k', description: 'Live support' },
    ]
</script>

<!-- Slotted heading -->
<tc-community-links id="cl3">
    <span slot="title"><strong>Our channels</strong></span>
</tc-community-links>
```

---