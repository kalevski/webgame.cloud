---
component: tc-simple-file
---

### tc-simple-file

File icon tile displaying a format-specific lucide glyph alongside the file name and extension. Sharp corners (`border-radius: 0`); slate neutrals throughout; extension rendered in JetBrains Mono uppercase. Purely presentational — no interaction, no events, no slots.

**Tag:** `tc-simple-file`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Base file name (without extension), e.g. `"report"` |
| `extension` | string | — | File extension, e.g. `".pdf"` or `"pdf"`. Rendered in mono uppercase below the name |
| `format` | `'unknown' \| 'image' \| 'audio' \| 'binary'` | `'unknown'` | Selects the icon glyph: `unknown` → File, `image` → Image, `audio` → Music, `binary` → Box. Also adds a subtle per-format tint to the icon box |

**JS Properties**

None.

**Events**

None.

**Slots**

None. All content is driven by attributes.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-simple-file-gap` | `0.5rem` | Gap between icon box and text block |
| `--bs-simple-file-icon-size` | `2rem` | Icon box width and height |
| `--bs-simple-file-icon-bg` | `var(--tc-surface-muted)` | Icon box background |
| `--bs-simple-file-icon-color` | `var(--tc-text-muted)` | Icon glyph color (overridden per-format) |
| `--bs-simple-file-icon-padding` | `0.375rem` | Inner padding inside the icon box |
| `--bs-simple-file-name-color` | `var(--tc-text)` | File name text color |
| `--bs-simple-file-name-font-size` | `0.875rem` | File name font size |
| `--bs-simple-file-ext-color` | `var(--tc-text-faint)` | Extension label color |
| `--bs-simple-file-ext-font-size` | `0.6875rem` | Extension label font size |

```html
<!-- Unknown format (default) -->
<tc-simple-file name="readme" extension=".md"></tc-simple-file>

<!-- Image -->
<tc-simple-file name="hero" extension=".jpg" format="image"></tc-simple-file>

<!-- Audio -->
<tc-simple-file name="intro" extension=".mp3" format="audio"></tc-simple-file>

<!-- Binary -->
<tc-simple-file name="firmware" extension=".bin" format="binary"></tc-simple-file>
```

---