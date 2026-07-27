---
component: tc-currency-chip
---

### tc-currency-chip

Compact currency pill pairing a leading glyph (a currency symbol or short token string) with a formatted amount. Restyled to the design system — sharp corners, slate-100 fill, 1px hairline border, ink-accented glyph, and a JetBrains Mono amount with tabular figures. Purely presentational and attribute-driven; no slots, no events. The amount is run through `toLocaleString()` so thousands separators appear automatically.

**Tag:** `tc-currency-chip`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `glyph` | string | — | Leading symbol or short token (e.g. `$`, `€`, `◆`, `XP`). Omitted when absent — the chip then shows the amount only |
| `amount` | number | `0` | Numeric value. Parsed with `parseFloat`; invalid values fall back to `0`. Rendered via `toLocaleString()` |
| `color` | string | `var(--tc-app-accent)` | Any CSS color value. Written to `--bs-currency-chip-color` on the host; tints the glyph only |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `glyph` | string | Reflects the `glyph` attribute |
| `amount` | number | Reflects the `amount` attribute as a real number (getter parses, setter stringifies) |
| `color` | string | Reflects the `color` attribute |

**Slots**

None. `tc-currency-chip` renders entirely from its attributes.

**Events**

None. `tc-currency-chip` is a purely presentational element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-currency-chip-color` | `var(--tc-app-accent)` | Glyph tint. Set via the `color` attribute or override in CSS |
| `--bs-currency-chip-padding-x` | `0.5rem` | Horizontal padding |
| `--bs-currency-chip-padding-y` | `0.25rem` | Vertical padding |
| `--bs-currency-chip-gap` | `0.375rem` | Gap between glyph and amount |
| `--bs-currency-chip-font-size` | `0.8125rem` | Chip font size |
| `--bs-currency-chip-bg` | `var(--tc-surface-muted)` | Chip background fill |
| `--bs-currency-chip-border-color` | `var(--tc-border)` | Hairline border color |
| `--bs-currency-chip-border-width` | `1px` | Border width |
| `--bs-currency-chip-amount-color` | `var(--tc-text)` | Amount text color |
| `--bs-currency-chip-amount-weight` | `500` | Amount font weight |
| `--bs-currency-chip-glyph-weight` | `600` | Glyph font weight |

```html
<!-- Basic -->
<tc-currency-chip glyph="$" amount="2499"></tc-currency-chip>
<tc-currency-chip glyph="€" amount="18050"></tc-currency-chip>

<!-- Symbol glyphs & large amounts (thousands separators are automatic) -->
<tc-currency-chip glyph="◆" amount="1250000"></tc-currency-chip>
<tc-currency-chip glyph="XP" amount="340"></tc-currency-chip>

<!-- Custom glyph color -->
<tc-currency-chip glyph="◆" amount="500" color="var(--tc-accent)"></tc-currency-chip>
<tc-currency-chip glyph="●" amount="42" color="var(--tc-success)"></tc-currency-chip>

<!-- Glyph-less (amount only) -->
<tc-currency-chip amount="64"></tc-currency-chip>
```

---