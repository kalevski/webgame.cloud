---
component: tc-combo-counter
---

### tc-combo-counter

Combo / multiplier HUD readout — a JetBrains Mono label, a large ink multiplier figure (`x{combo}`), and an optional draining timer bar. Purely presentational, attribute-driven, no slots. The readout only appears once a multiplier is building (`combo > 1`); below that the host collapses (no card is rendered and `display: none` is applied). When the `combo` is `2` or more, the host reflects a `data-visible` attribute. Styled to the toolcase design system — flat white surface, hairline border, sharp corners, ink accent on the value figure and timer fill.

**Tag:** `tc-combo-counter`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `combo` | number | `0` | Current combo / multiplier count. The readout is hidden unless this is `> 1`. Rendered as `x{combo}`. |
| `label` | string | `"Combo"` | Micro-label shown above the figure as an uppercase mono eyebrow. |
| `timer` | number\|null | `null` | Remaining time as a fraction `0`–`1` (clamped). When set, a timer bar is shown with the fill width at `timer * 100%`. Omit to hide the bar. |
| `font-size` | number | `36` | Multiplier figure size in pixels. Non-numeric or `<= 0` values fall back to `36`. Written to `--bs-combo-counter-value-size`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `combo` | `number` | Reflects the `combo` attribute. |
| `label` | `string` | Reflects the `label` attribute (defaults to `"Combo"`). |
| `timer` | `number \| null` | Reflects the `timer` attribute; `null` removes it. |
| `fontSize` | `number` | Reflects the `font-size` attribute. |

**Events**

None. `tc-combo-counter` is a purely presentational element.

**Slots**

None. `tc-combo-counter` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-combo-counter-bg` | `var(--tc-surface)` | Readout background. |
| `--bs-combo-counter-border-color` | `var(--tc-border-strong)` | 1px hairline border color. |
| `--bs-combo-counter-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-combo-counter-padding-y` | `0.625rem` | Vertical inner padding. |
| `--bs-combo-counter-padding-x` | `0.875rem` | Horizontal inner padding. |
| `--bs-combo-counter-min-width` | `6.5rem` | Minimum readout width. |
| `--bs-combo-counter-eyebrow-color` | `var(--tc-text-muted)` | Label micro-label color. |
| `--bs-combo-counter-eyebrow-font-size` | `0.6875rem` | Label font size (~11px). |
| `--bs-combo-counter-eyebrow-letter-spacing` | `0.12em` | Label letter spacing. |
| `--bs-combo-counter-value-color` | `var(--tc-app-accent)` | Multiplier figure color (ink accent). |
| `--bs-combo-counter-value-size` | `36px` | Multiplier figure size (set from the `font-size` attribute). |
| `--bs-combo-counter-value-weight` | `600` | Multiplier figure font weight (≤600). |
| `--bs-combo-counter-bar-height` | `4px` | Timer bar height. |
| `--bs-combo-counter-bar-track` | `var(--tc-surface-muted)` | Timer bar track fill. |
| `--bs-combo-counter-bar-border` | `var(--tc-border)` | Timer bar hairline border. |
| `--bs-combo-counter-bar-fill` | `var(--tc-app-accent)` | Timer bar fill color (ink accent). |

**Example**

```html
<!-- Building multiplier -->
<tc-combo-counter combo="5"></tc-combo-counter>

<!-- Custom label and a half-full timer bar -->
<tc-combo-counter combo="8" label="Streak" timer="0.6"></tc-combo-counter>

<!-- Larger figure -->
<tc-combo-counter combo="20" label="Mega" font-size="56" timer="0.85"></tc-combo-counter>

<!-- combo <= 1 renders nothing -->
<tc-combo-counter combo="1"></tc-combo-counter>
```

---