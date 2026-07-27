---
component: tc-portrait
---

### tc-portrait

Standalone character portrait frame. Displays a glyph (emoji, initials, unicode symbol, or image URL) with an optional level badge strip at the bottom and an optional colored ring outline accent. Styled to the toolcase design system (flat slate surface, 1px hairline border, sharp corners, JetBrains Mono level badge). No shadow root; light DOM; `display: block`.

**Tag:** `tc-portrait`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `glyph` | string | `''` | Content displayed in the portrait body — an emoji, initials, unicode glyph, or an image URL (auto-detected: starts with `http(s)://` or `/`, or ends with a common image extension); rendered as `<img>` for URLs, plain text otherwise |
| `size` | number | — | Override the portrait's width and height in pixels; sets `--bs-portrait-size` inline |
| `ring` | string | — | A CSS color value applied as a colored outline accent around the portrait border; sets `--bs-portrait-ring-color` inline |
| `level` | number | — | When provided, renders a JetBrains Mono level badge strip along the bottom edge of the portrait |
| `circle` | boolean | `false` | Applies `border-radius: 50%` to produce a circular portrait (sanctioned circle variant) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `glyph` | string | Mirrors the `glyph` attribute |
| `size` | number \| null | Mirrors the `size` attribute; `null` removes it |
| `ring` | string | Mirrors the `ring` attribute |
| `level` | number \| null | Mirrors the `level` attribute; `null` removes the badge |
| `circle` | boolean | Mirrors the `circle` boolean attribute |

**Events:** none — `tc-portrait` is purely presentational.

**Slots:** none — all content is attribute-driven.

**Custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-portrait-size` | `3.5rem` | Width and height of the portrait square |
| `--bs-portrait-glyph-size` | `1.5rem` | Font size of the glyph text |
| `--bs-portrait-bg` | `var(--tc-surface-muted)` | Portrait background fill |
| `--bs-portrait-border-color` | `var(--tc-border)` | 1px hairline border color |
| `--bs-portrait-glyph-color` | `var(--tc-text)` | Glyph text color |
| `--bs-portrait-ring-color` | `transparent` | Colored outline accent color (transparent = no ring) |
| `--bs-portrait-ring-width` | `2px` | Width of the ring outline |
| `--bs-portrait-ring-offset` | `2px` | Offset of the ring outline from the border |
| `--bs-portrait-level-bg` | `var(--tc-surface)` | Level badge background |
| `--bs-portrait-level-color` | `var(--tc-text-muted)` | Level badge text color |
| `--bs-portrait-level-border` | `1px solid var(--tc-border)` | Top border of the level badge strip |

```html
<!-- Basic glyph portrait -->
<tc-portrait glyph="⚔️"></tc-portrait>

<!-- With level badge -->
<tc-portrait glyph="🔮" level="34"></tc-portrait>

<!-- Custom size -->
<tc-portrait glyph="🛡️" size="64" level="12"></tc-portrait>

<!-- Colored ring accent -->
<tc-portrait glyph="⚔️" level="99" ring="var(--tc-app-accent)"></tc-portrait>

<!-- Circle variant -->
<tc-portrait glyph="K" circle="" ring="var(--tc-success, #16a34a)" level="7"></tc-portrait>

<!-- Image URL as glyph (auto-detected) -->
<tc-portrait glyph="https://example.com/avatar.png" size="64" level="42"></tc-portrait>

<!-- Theming via custom properties -->
<tc-portrait
  glyph="★"
  level="99"
  size="80"
  style="
    --bs-portrait-bg: var(--tc-app-accent);
    --bs-portrait-glyph-color: #fff;
    --bs-portrait-border-color: var(--tc-app-accent);
  "
></tc-portrait>
```

---