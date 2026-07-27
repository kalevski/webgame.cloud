---
component: tc-currency-display
---

### tc-currency-display

A larger currency readout pairing an optional label and currency icon with a prominent formatted amount. Restyled to the design system — sharp corners, slate neutrals, an uppercase JetBrains Mono micro-label above an ink-accented icon and a JetBrains Mono amount with tabular figures. Purely presentational and attribute-driven; no slots, no events. The amount is run through `toLocaleString()` so thousands separators appear automatically.

**Tag:** `tc-currency-display`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `amount` | number | `0` | Numeric value. Parsed with `parseFloat`; invalid values fall back to `0`. Rendered via `toLocaleString()` |
| `currency-icon` | string | — | Leading symbol or short token (e.g. `$`, `€`, `◆`, `XP`). Omitted when absent — the readout then shows the amount only |
| `label` | string | — | Optional uppercase mono micro-label shown above the readout. Omitted when absent |
| `color` | string | `var(--tc-app-accent)` | Any CSS color value. Written to `--bs-currency-display-color` on the host; tints the currency icon only |
| `font-size` | number | `1.75rem` | Amount font size in px. Written to `--bs-currency-display-amount-font-size` on the host; scales the prominent amount |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `amount` | number | Reflects the `amount` attribute as a real number (getter parses, setter stringifies) |
| `currencyIcon` | string | Reflects the `currency-icon` attribute |
| `label` | string | Reflects the `label` attribute |
| `color` | string | Reflects the `color` attribute |
| `fontSize` | number \| null | Reflects the `font-size` attribute as a number (null when unset) |

**Slots**

None. `tc-currency-display` renders entirely from its attributes.

**Events**

None. `tc-currency-display` is a purely presentational element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-currency-display-color` | `var(--tc-app-accent)` | Currency-icon tint. Set via the `color` attribute or override in CSS |
| `--bs-currency-display-amount-font-size` | `1.75rem` | Amount font size. Set via the `font-size` attribute (px) or override in CSS |
| `--bs-currency-display-gap` | `0.25rem` | Gap between the label and the readout row |
| `--bs-currency-display-readout-gap` | `0.5rem` | Gap between the icon and the amount |
| `--bs-currency-display-label-color` | `var(--tc-text-muted)` | Label text color |
| `--bs-currency-display-label-font-size` | `0.6875rem` | Label font size |
| `--bs-currency-display-label-letter-spacing` | `0.08em` | Label letter spacing |
| `--bs-currency-display-label-weight` | `500` | Label font weight |
| `--bs-currency-display-icon-font-size` | `1.25rem` | Currency-icon font size |
| `--bs-currency-display-icon-weight` | `600` | Currency-icon font weight |
| `--bs-currency-display-amount-color` | `var(--tc-text)` | Amount text color |
| `--bs-currency-display-amount-weight` | `600` | Amount font weight |

```html
<!-- Basic -->
<tc-currency-display label="Balance" currency-icon="$" amount="2499"></tc-currency-display>
<tc-currency-display label="Earnings" currency-icon="€" amount="180500"></tc-currency-display>

<!-- Symbol icons & large amounts (thousands separators are automatic) -->
<tc-currency-display label="Gems" currency-icon="◆" amount="1250000"></tc-currency-display>

<!-- Custom icon color -->
<tc-currency-display label="Credits" currency-icon="◆" amount="500" color="var(--tc-accent)"></tc-currency-display>

<!-- Custom font size -->
<tc-currency-display label="Headline" currency-icon="$" amount="980" font-size="40"></tc-currency-display>

<!-- Label-less & icon-less (amount only) -->
<tc-currency-display amount="1024"></tc-currency-display>
```

---