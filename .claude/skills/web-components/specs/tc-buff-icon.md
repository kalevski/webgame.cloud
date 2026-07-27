---
component: tc-buff-icon
---

### tc-buff-icon

A single buff / debuff status icon: a square slate tile with a centred lucide glyph and an optional mono duration caption pinned to the bottom edge. Styled to the toolcase design system — flat surface, hairline border, sharp corners, mono machine-text. Buff vs debuff is conveyed by a single 2px status accent stripe across the top (success for buffs, danger for debuffs). Composed by `tc-buff-bar`, but usable standalone. Purely presentational: no events, no slots.

**Tag:** `tc-buff-icon`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `glyph` | string | `""` | A [lucide](https://lucide.dev) icon name (e.g. `"Shield"`). An unknown name falls back to its escaped text (handy for single-letter buffs). |
| `time` | string | `""` | Duration caption rendered on the ink strip at the bottom of the tile. |
| `kind` | `"buff"` \| `"debuff"` | `"buff"` | Status kind; selects the accent-stripe color. Any value other than `"debuff"` resolves to `"buff"`. Reflected to `data-kind`. |
| `color` | string | `""` | Optional CSS color overriding the glyph color (written to `--bs-buff-icon-glyph-color`). |
| `size` | number | `36` | Pixel size of the tile. Non-positive / non-numeric values fall back to `36`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `glyph` | `string` | Reflects the `glyph` attribute. |
| `time` | `string` | Reflects the `time` attribute. |
| `kind` | `"buff" \| "debuff"` | Reflects the `kind` attribute. |
| `color` | `string` | Reflects the `color` attribute. |
| `size` | `number` | Reflects the `size` attribute. |

**Events**

None. `tc-buff-icon` is a purely presentational element.

**Slots**

None. `tc-buff-icon` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-buff-icon-size` | `36px` | Tile width and height (also settable via the `size` attribute). |
| `--bs-buff-icon-bg` | `var(--tc-surface)` | Tile background. |
| `--bs-buff-icon-border-color` | `var(--tc-border-strong)` | 1px hairline border color. |
| `--bs-buff-icon-glyph-color` | `var(--tc-text)` | Glyph color (overridden by the `color` attribute). |
| `--bs-buff-icon-glyph-scale` | `0.5` | Glyph SVG size as a fraction of the tile size. |
| `--bs-buff-icon-accent` | `var(--tc-text-faint)` | Top accent-stripe color (overridden per `data-kind`). |
| `--bs-buff-icon-time-bg` | `var(--tc-ink)` | Duration-caption strip background. |
| `--bs-buff-icon-time-color` | `var(--tc-surface)` | Duration-caption text color. |
| `--bs-buff-icon-time-font-size` | `0.5625rem` | Duration-caption font size. |

Per-kind accent overrides: `buff` → `var(--tc-success)`, `debuff` → `var(--tc-danger)`.

**Example**

```html
<tc-buff-icon kind="buff" glyph="Zap" time="12s" size="40"></tc-buff-icon>
<tc-buff-icon kind="debuff" glyph="Skull" time="6s" size="40"></tc-buff-icon>
```

---