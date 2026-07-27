---
component: tc-title
---

### tc-title

Large display title text for hero sections, screen headings, and prominent labels. Styled to the toolcase design system: slate neutrals, sharp corners. Slot content is the title text; `size` overrides the font size in pixels. No shadow root; light DOM; `display: block`.

**Tag:** `tc-title`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | `number` | — | Optional font size override in pixels (bare integer). Sets `--bs-title-font-size` inline. |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment. `center` also applies `margin: auto` for constrained max-widths. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `size` | `number \| null` | Get/set the `size` attribute as a number. |
| `align` | `'left' \| 'center' \| 'right'` | Get/set the `align` attribute. |

**Events**

None. `tc-title` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | The title text or markup to display. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-title-color` | `var(--tc-emphasis)` | Title text color. |
| `--bs-title-font-size` | `2.5rem` | Font size (overridden inline by `size` attribute). |
| `--bs-title-font-weight` | `700` | Font weight. |
| `--bs-title-line-height` | `1.15` | Line height. |
| `--bs-title-letter-spacing` | `-0.02em` | Letter-spacing. |
| `--bs-title-max-width` | `none` | Host max-width. |

**Example**

```html
<!-- Default left-aligned -->
<tc-title>The World Awaits</tc-title>

<!-- Center-aligned -->
<tc-title align="center">Forge Your Legend</tc-title>

<!-- Custom size -->
<tc-title size="72" align="center">GAME OVER</tc-title>

<!-- Custom accent color -->
<tc-title align="center" style="--bs-title-color: var(--tc-app-accent);">Champion</tc-title>
```

---