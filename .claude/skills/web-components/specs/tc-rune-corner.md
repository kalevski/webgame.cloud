---
component: tc-rune-corner
---

### tc-rune-corner

Decorative corner accent for absolutely-positioned framed surfaces. Voiced for the web-components design system — flat ink L-shaped clip. Purely presentational — no events, no slots.

**Tag:** `tc-rune-corner`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `at` | `'tl' \| 'tr' \| 'bl' \| 'br'` | `'tl'` | Corner placement: top-left, top-right, bottom-left, or bottom-right |
| `size` | `number` | — | Accent size in pixels. When absent the CSS default (14 px) is used |

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `at` | `RuneCornerPosition` | Reflects the `at` attribute |
| `size` | `number \| null` | Reflects the `size` attribute; `null` when absent |

#### Events

None. `tc-rune-corner` is purely presentational.

#### Slots

None. `tc-rune-corner` renders entirely from its attributes and CSS.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-rune-corner-size` | `14px` | Width and height of the accent |
| `--bs-rune-corner-bg` | `var(--tc-app-accent)` | Accent fill color |
| `--bs-rune-corner-opacity` | `1` | Opacity of the accent (0–1) |

#### Example

```html
<!-- Parent container must have position: relative (or absolute/fixed) -->
<div style="position: relative; width: 240px; height: 120px;">
  <tc-rune-corner at="tl"></tc-rune-corner>
  <tc-rune-corner at="tr"></tc-rune-corner>
  <tc-rune-corner at="bl"></tc-rune-corner>
  <tc-rune-corner at="br"></tc-rune-corner>
</div>

<!-- Larger accent with a custom color -->
<div style="position: relative; width: 320px; height: 160px;">
  <tc-rune-corner at="tl" size="22" style="--bs-rune-corner-bg: var(--tc-danger);"></tc-rune-corner>
  <tc-rune-corner at="tr" size="22" style="--bs-rune-corner-bg: var(--tc-danger);"></tc-rune-corner>
</div>
```


---